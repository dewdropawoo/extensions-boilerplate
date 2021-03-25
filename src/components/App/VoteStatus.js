import React from 'react'

import {REQUEST_STATE} from './App';

export default function VoteStatus(props) {
    return (
    <div style={{display: 'inline-block'}}>
      {props.voteStatus === REQUEST_STATE.SUCCESS && <span><span className="material-icons">check</span> Voted!</span>}
      {props.voteStatus === REQUEST_STATE.FAILED_UNKNOWN && <span><span className="material-icons">close</span> Failed</span>}
      {props.voteStatus === REQUEST_STATE.FAILED_AUTH && <span><span className="material-icons">close</span>Auth failed.</span>}
      {props.voteStatus === REQUEST_STATE.FAILED_ALREADY_VOTED && <span><span className="material-icons">close</span> You've already voted this round.</span>}
      {props.voteStatus === REQUEST_STATE.FAILED_ROUND_NOT_ACTIVE && <span><span className="material-icons">hourglass_empty</span>A round hasn't started yet.</span>}
      {props.voteStatus === REQUEST_STATE.FAILED_STREAMER_NOT_ACTIVE && <span><span className="material-icons">hourglass_empty</span>The broadcaster hasn't started yet.</span>}
    </div>
    )
}