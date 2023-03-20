<<<<<<< HEAD
import React from 'react';
import {Milestone, ProjectOnChain, ProjectState, User} from "../models";
import MilestoneItem from './milestoneItem';
import ChainService from "../services/chainService";

export type MilestonesProps = {
    projectOnChain: ProjectOnChain,
    firstPendingMilestoneIndex: number,
    user: User
    chainService: ChainService
}

type MilestonesState = {
    activeMilestone: number
}

export class Milestones extends React.Component<MilestonesProps, MilestonesState> {

    state: MilestonesState = {
        activeMilestone: 0,
    }

    toggleMilestone = (milestoneKey: number) => {
        this.setState({
            activeMilestone: milestoneKey != this.state.activeMilestone ? milestoneKey : -1
        })
    };


    render() {
        if (this.props.projectOnChain.milestones) {
            return (
                <div className="container accordion">
                    {this.props.projectOnChain.milestones.map((milestone, index) => (
                        <MilestoneItem
                            key={milestone.milestoneKey}
                            projectOnChain={this.props.projectOnChain}
                            milestone={milestone}
                            isInVotingRound={milestone.milestoneKey === this.props.firstPendingMilestoneIndex && this.props.projectOnChain.projectState === ProjectState.OpenForVoting}
                            toggleActive={this.state.activeMilestone === (milestone.milestoneKey)}
                            toggleMilestone={this.toggleMilestone}
                            user={this.props.user}
                            chainService={this.props.chainService}
                        />
                    ))}
                </div>
            );
        }
    }
=======
import React, { useState } from 'react';
import { ProjectOnChain, ProjectState } from "../models";
import MilestoneItem from './milestoneItem';

export type MilestonesProps = {
    projectOnChain: ProjectOnChain,
    firstPendingMilestoneIndex: number
}

export const Milestones = ({ projectOnChain, firstPendingMilestoneIndex }: MilestonesProps): JSX.Element => {
    const [activeMilestone, setActiveMilestone] = useState(0);

    const toggleMilestone = (milestoneKey: number) => {
        setActiveMilestone(milestoneKey != activeMilestone ? milestoneKey : -1);
    };

    return projectOnChain.milestones ?
        <div className="container accordion">
            {projectOnChain.milestones.map((milestone, index) => (
                <MilestoneItem
                    key={milestone.milestone_key}
                    projectOnChain={projectOnChain}
                    milestone={milestone}
                    isInVotingRound={milestone.milestone_key === firstPendingMilestoneIndex && projectOnChain.projectState === ProjectState.OpenForVoting}
                    toggleActive={activeMilestone === (milestone.milestone_key)}
                    toggleMilestone={toggleMilestone}
                />
            ))}
        </div> : <></>;
>>>>>>> upstream/imbue-enterprise
}