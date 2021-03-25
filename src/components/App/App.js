import React from 'react'
import Authentication from '../../util/Authentication/Authentication'

import PlayerMap from '../PlayerMap/PlayerMap';
import VoteStatus from './VoteStatus';

import 'leaflet/dist/leaflet.css';
import './App.css'

import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export const API_ENDPOINT = 'https://twitch-plays-geoguessr.wl.r.appspot.com';

export const REQUEST_STATE = {
  SUCCESS: 'SUCCESS',
  FAILED_UNKNOWN: 'FAILED_UNKNOWN',
  FAILED_AUTH: 'FAILED_AUTH',
  FAILED_STREAMER_NOT_ACTIVE: 'FAILED_STREAMER_NOT_ACTIVE',
  FAILED_ROUND_NOT_ACTIVE: 'FAILED_ROUND_NOT_ACTIVE',
  FAILED_ALREADY_VOTED: 'FAILED_ALREADY_VOTED',
}

export const PUBSUB_EVENTS = {
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  START: 'START',
  STOP: 'STOP',
}

export function handleFetchError(response) {
  if (!response.ok) {
    if (response.statusCode === 403) {
      this.setState({ voteStatus: FAILED_AUTH });
    }
  }
  return response;
}

export function fixLeafletMarkerShadow() {
  L.Marker.prototype.options.icon.shadowUrl = iconShadow;
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.Authentication = new Authentication()

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
    this.twitch = window.Twitch ? window.Twitch.ext : null
    this.state = {
      finishedLoading: false,
      theme: 'light',
      isVisible: true,

      authToken: null,

      selectedLatLng: null,
      channelActive: false,
      roundActive: false,

      requestState: null,
    }
  }

  contextUpdate(context, delta) {
    if (delta.includes('theme')) {
      this.setState(() => {
        return { theme: context.theme }
      })
    }
  }

  visibilityChanged(isVisible) {
    this.setState(() => {
      return {
        isVisible
      }
    })
  }

  componentDidMount() {
    fixLeafletMarkerShadow();

    if (this.twitch) {
      this.twitch.onAuthorized((auth) => {
        this.setState({ authToken: auth.token });
        this.Authentication.setToken(auth.token, auth.userId);
        if (!this.state.finishedLoading) {
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          this.initPubsub();
          this.fetchInitialState();

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          this.setState(() => {
            return { finishedLoading: true }
          })
        }
      })


      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible)
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

  latLngChange = (latLng) => {
    this.setState({ selectedLatLng: latLng });
  }

  initPubsub() {
    this.twitch.listen('broadcast', (target, contentType, body) => {

      if (body === PUBSUB_EVENTS.START) {
        this.setState({ roundActive: true, requestState: null, });
      }

      if (body === PUBSUB_EVENTS.STOP) {
        this.setState({ roundActive: false, requestState: null, });
      }

      if (body === PUBSUB_EVENTS.ACTIVATE) {
        this.setState({ channelActive: true, requestState: null, });
      }

      if (body === PUBSUB_EVENTS.DEACTIVATE) {
        this.setState({ channelActive: false, requestState: null, });
      }

      this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
    });
  }

  fetchInitialState() {
    fetch(`${API_ENDPOINT}/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.state.authToken}`
      },
    }).then(handleFetchError).then(response => response.json()).then(data => {
      this.setState(data);
    }).catch(error => {
      console.error(error);
    })
  }

  submitLatLng = () => {
    const data = {
      latLng: this.state.selectedLatLng,
    }

    fetch(`${API_ENDPOINT}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.state.authToken}`
      },
      body: JSON.stringify(data),
    })
      .then(handleFetchError)
      .then(response => response.json())
      .then(data => {
        if (data.message in REQUEST_STATE) {
          this.setState({ requestState: data.message });
        }
      })
      .catch((error) => {
        this.setState({ requestState: REQUEST_STATE.FAILED_UNKNOWN });

        console.error(error);
      });
  }

  render() {
    if (this.state.finishedLoading && this.state.isVisible) {
      return (
        <div className={`App ${this.state.theme === 'light' ? 'App-light' : 'App-dark'}`} >
          <div className="map-wrap">
            <PlayerMap onSelectedLatLngChange={this.latLngChange} />
          </div>
          {!(this.state.channelActive && this.state.roundActive) && <div className="footer">
            {!this.state.channelActive && <span><span className="material-icons">hourglass_empty</span>Hang tight! The broadcaster hasn't started yet.</span>}
            {this.state.channelActive && !this.state.roundActive && <span><span className="material-icons">hourglass_empty</span>Hang tight! A round hasn't started yet.</span>}
          </div>}
          <div className="footer">
            <div className="controls">
              <button disabled={!this.state.channelActive || !this.state.roundActive || !this.state.selectedLatLng}
                className="button"
                onClick={this.submitLatLng}>
                Submit!
              </button>
              <VoteStatus voteStatus={this.state.requestState} />
            </div>
            <div className="credits">
              <span className="material-icons">code</span><span className="material-icons">favorite</span> <a href="https://dewdrop.dog" target="_blank" rel="noopener">dewdrop</a> | <a href="https://dewdrop.dog/geoguessr" target="_blank" rel="noopener">info</a>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="App">
          Loading...
        </div>
      )
    }
  }
}