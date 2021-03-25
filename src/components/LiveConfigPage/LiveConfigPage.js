import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import { io } from 'socket.io-client';
import StreamerMap from '../StreamerMap/StreamerMap';
import './LiveConfigPage.css'
import { API_ENDPOINT, fixLeafletMarkerShadow } from '../App/App';

const CONNECTION_STATE = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
}

export default class LiveConfigPage extends React.Component {
  constructor(props) {
    super(props)
    this.Authentication = new Authentication()

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
    this.twitch = window.Twitch ? window.Twitch.ext : null
    this.state = {
      finishedLoading: false,
      theme: 'light',

      connectionState: CONNECTION_STATE.CONNECTING,
      roundActive: false,
      authToken: null,

      channelId: null,

      numSubmissions: 0,
      currentAverage: null,
      socket: null,
    }
  }


  contextUpdate(context, delta) {
    if (delta.includes('theme')) {
      this.setState(() => {
        return { theme: context.theme }
      })
    }
  }

  componentDidMount() {
    fixLeafletMarkerShadow();

    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        this.Authentication.setToken(auth.token, auth.userId)
        this.setState({ channelId: auth.channelId, authToken: auth.token });

        if (!this.state.finishedLoading) {
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          this.setState(() => {
            return { finishedLoading: true }
          })
        }
        this.initSocket();
      });

      this.twitch.listen('broadcast', (target, contentType, body) => {
        this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
        // now that you've got a listener, do something with the result... 

        // do something...

      })

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta)
      })
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))
    }
  }

  initSocket() {
    const socket = io(API_ENDPOINT);
    socket.on('connect', () => {
      this.setState({
        connectionState: CONNECTION_STATE.CONNECTED,
      });
      socket.emit('live', { channel: this.state.channelId, token: this.state.authToken });
    });

    socket.on('vote', (data) => {
      this.setState({ numSubmissions: data.count, currentAverage: data.average });
      console.log(this.state.currentAverage);
    });

    socket.on('disconnect', () => {
      this.setState({
        connectionState: CONNECTION_STATE.DISCONNECTED,
      });
    });

    this.setState({ socket });
  }

  startRound = () => {
    this.setState({ roundActive: true });
    this.state.socket.emit('start round', { token: this.state.authToken });
  }

  stopRound = () => {
    this.setState({ roundActive: false });
    this.state.socket.emit('stop round', { token: this.state.authToken });
  }

  render() {
    if (this.state.finishedLoading) {
      return (
        <div className={`LiveConfigPage ${this.state.theme === 'light' ? 'LiveConfigPage-light' : 'LiveConfigPage-dark'}`}>
          <div className="header">
            <p>Don't close this page! Viewer submissions are recorded only when this page is open (minimizing is ok!)</p>
          </div>
          <div className="header">
            {this.state.connectionState === CONNECTION_STATE.CONNECTING
              && <span><span className="material-icons">hourglass_empty</span> Connecting...</span>}
            {this.state.connectionState === CONNECTION_STATE.CONNECTED
              && <span><span className="material-icons">check</span> Connected!</span>}
            {this.state.connectionState === CONNECTION_STATE.DISCONNECTED
              && <span><span className="material-icons">close</span> Disconnected! Try refreshing the page.</span>}
          </div>
          <div className="header">
            <div className="controls">
              {!this.state.roundActive && <button className="button" onClick={this.startRound}>Start Round</button>}
              {this.state.roundActive && <button className="button" onClick={this.stopRound}>Stop Round</button>}
            </div>
            <div className="counter">
              Total submissions: {this.state.numSubmissions}
            </div>
          </div>
          <div className="map-wrap">
            <StreamerMap marker={this.state.currentAverage} />
          </div>
        </div>
      )
    } else {
      return (
        <div className="LiveConfigPage">
          Loading...
        </div>
      )
    }
  }
}