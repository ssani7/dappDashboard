<<<<<<< HEAD
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { Tab, TabBar } from "@rmwc/tabs";
import { List, SimpleListItem } from "@rmwc/list";
import * as utils from "./utils";
import * as polkadot from "./utils/polkadot";
import { Currency, RoundType, Project, ProjectOnChain, User, ProjectState } from "./models";
import "../../public/proposal.css"
import '@rmwc/list/styles';
import { marked } from "marked";

import { Contribute } from './components/contribute';
import { Milestones } from './components/milestones';
import { FundingInfo } from './components/fundingInfo';
import { SubmitMilestone } from './components/submitMilestone';
import { VoteOnMilestone } from './components/voteOnMilestone';
import { ApproveMilestone } from './components/approveMilestone';

import ChainService from "./services/chainService";
import { Withdraw } from "./components/withdraw";

type DetailsProps = {
    imbueApi: polkadot.ImbueApiInfo,
    projectId: string | number | null,
    user: User,
    chainService: ChainService
}

type DetailsState = {
    activeTabIndex: number,
    projectOnChain: ProjectOnChain,
    lastApprovedMilestoneIndex: number,
    firstPendingMilestoneIndex: number,
    userIsInitiator: boolean,
    showContributeComponent: boolean,
    showSubmitMilestoneComponent: boolean,
    showVoteComponent: boolean,
    showApproveMilestoneComponent: boolean,
    showWithdrawComponent: boolean
}

const initiatorHeadingMapping: Record<ProjectState, JSX.Element> = {
    /* PROJECT HAS BEEN CREATED SUCCESSFULLY AND pending ADDITION TO FUNDING ROUND */
    [ProjectState.PendingProjectApproval]: <h3>Funding for this project is not yet open. Check back soon for more updates!</h3>,

    /* PROJECT IS PENDING FUNDING APPROVAL ROUND */
    [ProjectState.PendingFundingApproval]: <h3>Pending funding approval. Funding round not complete or approved. Please <a href="https://discord.gg/jyWc6k8a">contact the team</a> for review.</h3>,

    /* PROJECT IS IN THE CONTRIBUTION ROUND */
    [ProjectState.OpenForContribution]: <h3>Your proposal has been created successfully and added to the funding round. Contributors can now fund your project</h3>,

    /* PROJECT IS IN THE VOTING ROUND */

    [ProjectState.OpenForVoting]: <></>,

    [ProjectState.PendingMilestoneApproval]: <h3>Pending milestone approval. Milestone voting round not complete or approved. Please <a href='https://discord.gg/jyWc6k8a'>contact the team</a> for review.</h3>,

    /* PROJECT IS pending MILESTONE SUBMISSION */
    [ProjectState.PendingMilestoneSubmission]: <h3>Pending milestone submission</h3>,

    [ProjectState.OpenForWithdraw]: <></>


}

const contributorHeadingMapping: Record<ProjectState, JSX.Element> = {
    /* PROJECT HAS BEEN CREATED SUCCESSFULLY AND pending ADDITION TO FUNDING ROUND */
    [ProjectState.PendingProjectApproval]: <h3>Funding for this project is not yet open. Check back soon for more updates!</h3>,

    /* PROJECT IS PENDING FUNDING APPROVAL ROUND */
    [ProjectState.PendingFundingApproval]: <h3>Pending funding approval. Funding round not complete or approved. Please <a href="https://discord.gg/jyWc6k8a">contact the team</a> for review.</h3>,

    /* PROJECT IS IN THE CONTRIBUTION ROUND */
    [ProjectState.OpenForContribution]: <h3>This project is open for contributions!</h3>,

    [ProjectState.PendingMilestoneSubmission]: <></>,

    /* PROJECT IS IN THE VOTING ROUND */
    [ProjectState.OpenForVoting]: <h3>Project contributors can now vote on milestones</h3>,

    /* PROJECT IS IN THE VOTING ROUND */
    [ProjectState.PendingMilestoneApproval]: <></>,

    /* PROJECT IS pending MILESTONE SUBMISSION */
    [ProjectState.PendingMilestoneSubmission]: <h3>Pending milestone submission</h3>,

    [ProjectState.OpenForWithdraw]: <></>
}

class Details extends React.Component<DetailsProps, DetailsState> {
    state: DetailsState = {
        activeTabIndex: 0,
        projectOnChain: {} as ProjectOnChain,
        lastApprovedMilestoneIndex: -1,
        firstPendingMilestoneIndex: -1,
        userIsInitiator: false,
        showContributeComponent: false,
        showSubmitMilestoneComponent: false,
        showVoteComponent: false,
        showApproveMilestoneComponent: false,
        showWithdrawComponent: false
    }

    constructor(props: DetailsProps) {
        super(props);
    }

    setActiveTab(tabIndex: number) {
        this.setState({ activeTabIndex: tabIndex });
    }

    async setProjectState(projectOnChain: ProjectOnChain): Promise<void> {
        let userIsInitiator = await this.props.chainService.isUserInitiator(this.props.user, projectOnChain);

        let showContributeComponent = false
        let showSubmitMilestoneComponent = false;
        let showVoteComponent = false;
        let showApproveMilestoneComponent = false;
        let showWithdrawComponent = false;

        if (!projectOnChain.milestones) {
            return;
        }

        const projectMilestones = await this.props.chainService.getProjectMilestones(projectOnChain);

        let lastApprovedMilestoneIndex = await this.props.chainService.findLastApprovedMilestone(projectMilestones);
        let firstPendingMilestoneIndex = await this.props.chainService.findFirstPendingMilestone(projectMilestones);

        const projectState = projectOnChain.projectState

        if (userIsInitiator) {
            // SHOW WITHDRAW AND MILESTONE SUBMISSION components
            showSubmitMilestoneComponent = projectOnChain.fundingThresholdMet && firstPendingMilestoneIndex >= 0;
            showWithdrawComponent = lastApprovedMilestoneIndex >= 0 && projectOnChain.raisedFunds > projectOnChain.withdrawnFunds;
            showApproveMilestoneComponent = projectOnChain.fundingThresholdMet && firstPendingMilestoneIndex >= 0;
        } else {
            switch (projectState) {
                case ProjectState.OpenForContribution: {
                    showContributeComponent = true;
                    break
                }
                case ProjectState.OpenForVoting: {
                    showVoteComponent = true;
                    break;
                }
            }
        }


        // USE THIS FOR DEMO
        // projectOnChain.milestones[0].isApproved = true;
        // projectOnChain.milestones[1].isApproved = true;
        // lastApprovedMilestoneIndex = 1;
        // lastPendingMilestoneIndex = 2;
        // projectOnChain.projectState = ProjectState.OpenForVoting;


        this.setState({
            projectOnChain: projectOnChain,
            lastApprovedMilestoneIndex: lastApprovedMilestoneIndex,
            firstPendingMilestoneIndex: firstPendingMilestoneIndex,
            userIsInitiator: userIsInitiator,
            showContributeComponent: showContributeComponent,
            showSubmitMilestoneComponent: showSubmitMilestoneComponent,
            showVoteComponent: showVoteComponent,
            showApproveMilestoneComponent: showApproveMilestoneComponent,
            showWithdrawComponent: showWithdrawComponent,
        })
    }

    async componentDidMount() {

        if (this.props.projectId) {
            const project: ProjectOnChain = await this.props.chainService.getProject(this.props.projectId);
            if (!project) {
                utils.redirect("/not-found");
                location.reload();
                return;
            }
            this.setProjectState(project);
        }
    }

    showProjectStateHeading(): JSX.Element {
        if (this.state.userIsInitiator) {
            return initiatorHeadingMapping[this.state.projectOnChain.projectState];
        } else {
            return contributorHeadingMapping[this.state.projectOnChain.projectState];
        }
    }

    render() {
        if (this.state.projectOnChain.milestones) {
            return <div id="details">
                <div className="top-wrapper">
                    <header className="project-name-header"><h1 className="heading-8 project-name-heading"><span
                        id="project-name">{this.state.projectOnChain.name}</span></h1></header>
                    <img id="project-logo" loading="lazy"
                        srcSet={this.state.projectOnChain.logo} />
                </div>

                {this.showProjectStateHeading()}
                <FundingInfo projectOnChain={this.state.projectOnChain} lastApprovedMilestoneIndex={this.state.lastApprovedMilestoneIndex}></FundingInfo>
                <div className="action-buttons">
                    {this.state.showContributeComponent ?
                        <Contribute
                            projectOnChain={this.state.projectOnChain}
                            user={this.props.user}
                            imbueApi={this.props.imbueApi}
                            chainService={this.props.chainService}
                        ></Contribute>
                        : null
                    }
                    {this.state.showSubmitMilestoneComponent ?
                        <SubmitMilestone
                            projectOnChain={this.state.projectOnChain}
                            user={this.props.user}
                            imbueApi={this.props.imbueApi}
                            chainService={this.props.chainService}
                        ></SubmitMilestone>
                        : null
                    }
                    {this.state.showVoteComponent ?
                        <VoteOnMilestone
                            projectOnChain={this.state.projectOnChain}
                            user={this.props.user}
                            imbueApi={this.props.imbueApi}
                            firstPendingMilestoneIndex={this.state.firstPendingMilestoneIndex}
                            chainService={this.props.chainService}
                        ></VoteOnMilestone>
                        : null
                    }
                    {this.state.showApproveMilestoneComponent ?
                        <ApproveMilestone
                            projectOnChain={this.state.projectOnChain}
                            user={this.props.user}
                            imbueApi={this.props.imbueApi}
                            firstPendingMilestoneIndex={this.state.firstPendingMilestoneIndex}
                            chainService={this.props.chainService}
                        ></ApproveMilestone>
                        : null
                    }

                    {this.state.showWithdrawComponent ?
                        <Withdraw
                            projectOnChain={this.state.projectOnChain}
                            user={this.props.user}
                            imbueApi={this.props.imbueApi}
                            chainService={this.props.chainService}
                        ></Withdraw>
                        : null
                    }
                </div>
                <TabBar activeTabIndex={this.state.activeTabIndex}
                    onActivate={(evt) => this.setActiveTab(evt.detail.index)}>
                    <Tab icon="description" label="About" />
                    <Tab icon="list" label="Milestones" />
                    <Tab icon="quiz" label="FAQ" />
                    <Tab icon="groups2" label="team" />
                    <Tab icon="update" label="Updates" />
                </TabBar>

                <div id="tab-content-container">
                    <div className={`tab-content ${this.state.activeTabIndex === 0 ? "active" : ""}`}>
                        <h2>{this.state.projectOnChain.name}</h2>
                        <div id="project-description"
                            dangerouslySetInnerHTML={{ __html: marked.parse(`${this.state.projectOnChain.description}`) }}>
                        </div>
                        <ul className="project-details">
                            <li className="project-detail"><span className="detail-value hidden" id="in-block"></span></li>
                            <li className="project-detail">
                                <span className="detail-label"></span>
                                <span id="project-detail-currency"
                                    className="imbu-currency-label">${this.state.projectOnChain.currencyId as Currency}</span>{' '}
                                <span id="funds-required">{this.state.projectOnChain.requiredFundsFormatted.toLocaleString()}</span>
                                <span className="imbu-currency-label fraction">.00</span>{' '}
                                <span className="detail-label">required</span>
                            </li>
                            <li className="project-detail">
                                <span className="detail-value" id="project-website">
                                    <a href={this.state.projectOnChain.website} target="_blank">{this.state.projectOnChain.website}</a>
                                </span>
                            </li>
                        </ul>
                    </div>


                    <div className={`tab-content ${this.state.activeTabIndex === 1 ? "active" : ""}`}>
                        <Milestones projectOnChain={this.state.projectOnChain} firstPendingMilestoneIndex={this.state.firstPendingMilestoneIndex} user={this.props.user} chainService={this.props.chainService}></Milestones>
                    </div>

                    <div className={`tab-content ${this.state.activeTabIndex === 2 ? "active" : ""}`}>
                        <List twoLine id="FAQ">
                            <h2>Coming soon.....</h2>
                        </List>
                    </div>

                    <div className={`tab-content ${this.state.activeTabIndex === 3 ? "active" : ""}`}>
                        <List twoLine id="Team">
                            <h2>Coming soon.....</h2>
                        </List>
                    </div>

                    <div className={`tab-content ${this.state.activeTabIndex === 4 ? "active" : ""}`}>
                        <List twoLine id="Updates">
                            <h2>Coming soon.....</h2>
                        </List>
                    </div>
                </div>
            </div>
        }
    }
}

document.addEventListener("DOMContentLoaded", async (event) => {
    const imbueApi = await polkadot.initImbueAPIInfo();
    const projectId = await utils.getProjectId();
    const user = await utils.getCurrentUser();
    const chainService = new ChainService(imbueApi, user);
    ReactDOMClient.createRoot(document.getElementById('project-body')!)
        .render(<Details imbueApi={imbueApi} projectId={projectId} user={user} chainService={chainService} />);
=======
import React, { useState, useEffect } from 'react';
import * as ReactDOMClient from "react-dom/client";
import { Tab, TabBar } from "@rmwc/tabs";
import { List, SimpleListItem } from "@rmwc/list";
import * as utils from "./utils";
import * as polkadot from "./utils/polkadot";
import { Currency, RoundType, Project, ProjectOnChain, User, ProjectState } from "./models";
import "../../public/proposal.css"
import '@rmwc/list/styles';
import { marked } from "marked";

import { Contribute } from './components/contribute';
import { Milestones } from './components/milestones';
import { FundingInfo } from './components/fundingInfo';
import { SubmitMilestone } from './components/submitMilestone';
import { VoteOnMilestone } from './components/voteOnMilestone';
import { ApproveMilestone } from './components/approveMilestone';
import { Withdraw } from "./components/withdraw";

import ChainService from "./services/chainService";

type DetailsProps = {
    imbueApi: polkadot.ImbueApiInfo,
    projectId: string | number | null,
    user: User,
    chainService: ChainService
}

type DetailsState = {
    activeTabIndex: number,
    projectOnChain: ProjectOnChain,
    lastApprovedMilestoneIndex: number,
    firstPendingMilestoneIndex: number,
    userIsInitiator: boolean,
    showContributeComponent: boolean,
    showSubmitMilestoneComponent: boolean,
    showVoteComponent: boolean,
    showApproveMilestoneComponent: boolean,
    showWithdrawComponent: boolean
}

const initiatorHeadingMapping: Record<ProjectState, JSX.Element> = {
    /* PROJECT HAS BEEN CREATED SUCCESSFULLY AND pending ADDITION TO FUNDING ROUND */
    [ProjectState.PendingProjectApproval]: <h3>Funding for this project is not yet open. Check back soon for more updates!</h3>,

    /* PROJECT IS PENDING FUNDING APPROVAL ROUND */
    [ProjectState.PendingFundingApproval]: <h3>Pending funding approval. Funding round not complete or approved. Please <a href="https://discord.gg/jyWc6k8a">contact the team</a> for review.</h3>,

    /* PROJECT IS IN THE CONTRIBUTION ROUND */
    [ProjectState.OpenForContribution]: <h3>Your proposal has been created successfully and added to the funding round. Contributors can now fund your project</h3>,

    /* PROJECT IS IN THE VOTING ROUND */

    [ProjectState.OpenForVoting]: <></>,

    [ProjectState.PendingMilestoneApproval]: <h3>Pending milestone approval. Milestone voting round not complete or approved. Please <a href='https://discord.gg/jyWc6k8a'>contact the team</a> for review.</h3>,

    /* PROJECT IS pending MILESTONE SUBMISSION */
    [ProjectState.PendingMilestoneSubmission]: <h3>Pending milestone submission</h3>,

    [ProjectState.OpenForWithdraw]: <></>

}

const contributorHeadingMapping: Record<ProjectState, JSX.Element> = {
    /* PROJECT HAS BEEN CREATED SUCCESSFULLY AND pending ADDITION TO FUNDING ROUND */
    [ProjectState.PendingProjectApproval]: <h3>Funding for this project is not yet open. Check back soon for more updates!</h3>,

    /* PROJECT IS PENDING FUNDING APPROVAL ROUND */
    [ProjectState.PendingFundingApproval]: <h3>Pending funding approval. Funding round not complete or approved. Please <a href="https://discord.gg/jyWc6k8a">contact the team</a> for review.</h3>,

    /* PROJECT IS IN THE CONTRIBUTION ROUND */
    [ProjectState.OpenForContribution]: <h3>This project is open for contributions!</h3>,

    [ProjectState.PendingMilestoneSubmission]: <></>,

    /* PROJECT IS IN THE VOTING ROUND */
    [ProjectState.OpenForVoting]: <h3>Project contributors can now vote on milestones</h3>,

    /* PROJECT IS IN THE VOTING ROUND */
    [ProjectState.PendingMilestoneApproval]: <></>,

    /* PROJECT IS pending MILESTONE SUBMISSION */
    [ProjectState.PendingMilestoneSubmission]: <h3>Pending milestone submission</h3>,

    [ProjectState.OpenForWithdraw]: <></>
}

export const Details = ({ chainService, user, projectId, imbueApi }: DetailsProps): JSX.Element => {
    const [activeTabIndex, setActiveTab] = useState(0);
    const [projectOnChain, setProjectOnChain] = useState<ProjectOnChain>();
    const [lastApprovedMilestoneIndex, setLastApprovedMilestoneIndex] = useState(-1);
    const [firstPendingMilestoneIndex, setFirstPendingMilestoneIndex] = useState(-1);
    const [userIsInitiator, setUserIsInitiator] = useState(false);
    const [contributeVisible, showContribue] = useState(false);
    const [submitVisible, showSubmit] = useState(false);
    const [voteVisible, showVote] = useState(false);
    const [approvedVisible, showApproved] = useState(false);
    const [withdrawVisible, showWithdraw] = useState(false);

    const setProjectState = async (_projectOnChain: ProjectOnChain): Promise<void> => {
        let _userIsInitiator = await chainService.isUserInitiator(user, _projectOnChain);

        let _contributeVisible = false
        let _submitVisible = false;
        let _voteVisible = false;
        let _approvedVisible = false;
        let _withdrawVisible = false;

        if (!_projectOnChain.milestones) {
            return;
        }

        const projectMilestones = await chainService.getProjectMilestones(_projectOnChain);

        let _lastApprovedMilestoneIndex = await chainService.findLastApprovedMilestone(projectMilestones);
        let _firstPendingMilestoneIndex = await chainService.findFirstPendingMilestone(projectMilestones);

        const projectState = _projectOnChain.projectState

        if (_userIsInitiator) {
            // SHOW WITHDRAW AND MILESTONE SUBMISSION components
            _submitVisible = _projectOnChain.fundingThresholdMet && _firstPendingMilestoneIndex >= 0;
            _withdrawVisible = _lastApprovedMilestoneIndex >= 0 && _projectOnChain.raisedFunds > _projectOnChain.withdrawnFunds;
            _approvedVisible = _projectOnChain.fundingThresholdMet && _firstPendingMilestoneIndex >= 0;
        } else {
            switch (projectState) {
                case ProjectState.OpenForContribution: {
                    _contributeVisible = true;
                    break
                }
                case ProjectState.OpenForVoting: {
                    _voteVisible = true;
                    break;
                }
            }
        }

        // USE THIS FOR DEMO
        // projectOnChain.milestones[0].isApproved = true;
        // projectOnChain.milestones[1].isApproved = true;
        // lastApprovedMilestoneIndex = 1;
        // lastPendingMilestoneIndex = 2;
        // projectOnChain.projectState = ProjectState.OpenForVoting;

        setProjectOnChain(_projectOnChain);
        setLastApprovedMilestoneIndex(_lastApprovedMilestoneIndex);
        setFirstPendingMilestoneIndex(_firstPendingMilestoneIndex);
        setUserIsInitiator(_userIsInitiator);
        showContribue(_contributeVisible);
        showSubmit(_submitVisible);
        showVote(_voteVisible);
        showApproved(_approvedVisible);
        showWithdraw(_withdrawVisible);
    }

    const fetchAndSetProject = async (projectId) => {
        const project: ProjectOnChain = await chainService.getProject(projectId);
        if (!project) {
            utils.redirect("not-found");
            location.reload();
            return;
        }
        setProjectState(project);
    };

    useEffect(() => {
        if (projectId) {
            void fetchAndSetProject(projectId);
        }
    }, []);

    return projectOnChain && projectOnChain.milestones ?
        <div id="details">
            <div className="top-wrapper">
                <header className="project-name-header">
                    <h1 className="heading-8 project-name-heading">
                        <span id="project-name">{projectOnChain.name}</span></h1></header>
                <img id="project-logo" loading="lazy" srcSet={projectOnChain.logo} />
            </div>

            {userIsInitiator ? initiatorHeadingMapping[projectOnChain.projectState] : contributorHeadingMapping[projectOnChain.projectState]}
            <FundingInfo projectOnChain={projectOnChain} lastApprovedMilestoneIndex={lastApprovedMilestoneIndex}></FundingInfo>
            <div className="action-buttons">
                {contributeVisible ?
                    <Contribute
                        projectOnChain={projectOnChain}
                        user={user}
                        imbueApi={imbueApi}
                        chainService={chainService}
                    ></Contribute>
                    : null
                }
                {submitVisible ?
                    <SubmitMilestone
                        projectOnChain={projectOnChain}
                        user={user}
                        imbueApi={imbueApi}
                        chainService={chainService}
                    ></SubmitMilestone>
                    : null
                }
                {voteVisible ?
                    <VoteOnMilestone
                        projectOnChain={projectOnChain}
                        user={user}
                        imbueApi={imbueApi}
                        firstPendingMilestoneIndex={firstPendingMilestoneIndex}
                        chainService={chainService}
                    ></VoteOnMilestone>
                    : null
                }
                {approvedVisible ?
                    <ApproveMilestone
                        projectOnChain={projectOnChain}
                        user={user}
                        imbueApi={imbueApi}
                        firstPendingMilestoneIndex={firstPendingMilestoneIndex}
                        chainService={chainService}
                    ></ApproveMilestone>
                    : null
                }

                {withdrawVisible ?
                    <Withdraw
                        projectOnChain={projectOnChain}
                        user={user}
                        imbueApi={imbueApi}
                        chainService={chainService}
                    ></Withdraw>
                    : null
                }
            </div>
            <TabBar activeTabIndex={activeTabIndex}
                onActivate={(evt) => setActiveTab(evt.detail.index)}>
                <Tab icon="description" label="About" />
                <Tab icon="list" label="Milestones" />
                <Tab icon="quiz" label="FAQ" />
                <Tab icon="groups2" label="team" />
                <Tab icon="update" label="Updates" />
            </TabBar>

            <div id="tab-content-container">
                <div className={`tab-content ${activeTabIndex === 0 ? "active" : ""}`}>
                    <h2>{projectOnChain.name}</h2>
                    <div id="project-description"
                        dangerouslySetInnerHTML={{ __html: marked.parse(`${projectOnChain.description}`) }}>
                    </div>
                    <ul className="project-details">
                        <li className="project-detail"><span className="detail-value hidden" id="in-block"></span></li>
                        <li className="project-detail">
                            <span className="detail-label"></span>
                            <span id="project-detail-currency"
                                className="imbu-currency-label">${projectOnChain.currencyId as Currency}</span>{' '}
                            <span id="funds-required">{projectOnChain.requiredFundsFormatted.toLocaleString()}</span>
                            <span className="imbu-currency-label fraction">.00</span>{' '}
                            <span className="detail-label">required</span>
                        </li>
                        <li className="project-detail">
                            <span className="detail-value" id="project-website">
                                <a href={projectOnChain.website} target="_blank">{projectOnChain.website}</a>
                            </span>
                        </li>
                    </ul>
                </div>

                <div className={`tab-content ${activeTabIndex === 1 ? "active" : ""}`}>
                    <Milestones projectOnChain={projectOnChain} firstPendingMilestoneIndex={firstPendingMilestoneIndex}></Milestones>
                </div>

                <div className={`tab-content ${activeTabIndex === 2 ? "active" : ""}`}>
                    <List twoLine id="FAQ">
                        <h2>Coming soon.....</h2>
                    </List>
                </div>

                <div className={`tab-content ${activeTabIndex === 3 ? "active" : ""}`}>
                    <List twoLine id="Team">
                        <h2>Coming soon.....</h2>
                    </List>
                </div>

                <div className={`tab-content ${activeTabIndex === 4 ? "active" : ""}`}>
                    <List twoLine id="Updates">
                        <h2>Coming soon.....</h2>
                    </List>
                </div>
            </div>
        </div> : <></>;
}

document.addEventListener("DOMContentLoaded", async (event) => {
    const imbueApi = await polkadot.initImbueAPIInfo();
    const projectId = await utils.getProjectId();
    const user = await utils.getCurrentUser();
    const chainService = new ChainService(imbueApi, user);
    ReactDOMClient.createRoot(document.getElementById('project-body')!)
        .render(<Details imbueApi={imbueApi} projectId={projectId} user={user} chainService={chainService} />);
>>>>>>> upstream/imbue-enterprise
});