import { ImbueApiInfo, initImbueAPIInfo } from "../utils/polkadot";
import * as React from 'react';
import { TextField } from "@rmwc/textfield";
import '@rmwc/textfield/styles';
import * as polkadot from "../utils/polkadot";
import { BasicTxResponse, Currency, Contribution, Milestone, Project, ProjectOnChain, ProjectState, RoundType, User } from "../models";
import { web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { DispatchError } from '@polkadot/types/interfaces';
import type { ITuple, } from "@polkadot/types/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import type { EventRecord } from '@polkadot/types/interfaces';
import * as utils from "../utils";
import type { AnyJson } from '@polkadot/types/types';
import { stringify } from "querystring";


type EventDetails = {
    accountIdKey: number,
    eventName: string
}

const eventMapping: Record<string, EventDetails> = {
    "contribute": { accountIdKey: 0, eventName: "ContributeSucceeded" },
}

class ChainService {
    imbueApi: ImbueApiInfo;
    constructor(imbueApi: ImbueApiInfo) {
        this.imbueApi = imbueApi;
    }

    public async contribute(account: InjectedAccountWithMeta, projectOnChain: any, contribution: bigint): Promise<BasicTxResponse> {
        const projectId = projectOnChain.milestones[0].projectKey;
        const extrinsic = await this.imbueApi.imbue.api.tx.imbueProposals.contribute(
            projectId,
            contribution
        );
        return await this.submitImbueExtrinsic(account, extrinsic, eventMapping["contribute"].accountIdKey, eventMapping["contribute"].eventName);
    }

    async submitImbueExtrinsic(account: InjectedAccountWithMeta, extrinsic: SubmittableExtrinsic<'promise'>, eventKey: number, eventName: String): Promise<BasicTxResponse> {
        const injector = await web3FromSource(account.meta.source);
        const transactionState: BasicTxResponse = {} as BasicTxResponse;
        try {
            const unsubscribe = await extrinsic
                .signAndSend(
                    account.address,
                    { signer: injector.signer }, (result) => {
                        this.imbueApi.imbue.api.query.system.events((events: EventRecord[]) => {
                            if (!result || !result.status || !events) {
                                return;
                            }

                            events
                                .filter(({ event: { data, method, section }, phase }: EventRecord) => section === 'imbueProposals' || section === 'system')
                                .forEach(({ event: { data, method, section }, phase }: EventRecord): BasicTxResponse => {
                                    transactionState.transactionHash = extrinsic.hash.toHex();

                                    const [dispatchError] = data as unknown as ITuple<[DispatchError]>;
                                    if (dispatchError.isModule) {
                                        return this.handleError(transactionState, dispatchError);
                                    }

                                    if (eventName && method === eventName && data[eventKey].toHuman() === account.address) {
                                        transactionState.status = true;
                                        return transactionState;
                                    }
                                    else if (method === 'ExtrinsicFailed') {
                                        transactionState.status = false;
                                        transactionState.txError = true;
                                        return transactionState;
                                    }
                                    return transactionState;
                                });


                            if (result.isError) {
                                transactionState.txError = true;
                                return transactionState;
                            }

                            if (result.isCompleted) {
                                unsubscribe();
                                return transactionState;
                            }
                        });
                    });
        } catch (error) {
            if (error instanceof Error) {
                transactionState.errorMessage = error.message;
            }
            transactionState.txError = true;
        } finally {
            return transactionState;
        }
    }

    async submitExtrinsic(account: InjectedAccountWithMeta, extrinsic: SubmittableExtrinsic<'promise'>): Promise<BasicTxResponse> {
        const injector = await web3FromSource(account.meta.source);
        const transactionState: BasicTxResponse = {} as BasicTxResponse;
        try {
            const unsubscribe = await extrinsic
                .signAndSend(
                    account.address,
                    { signer: injector.signer }, (result) => {
                        (async () => {
                            if (!result || !result.status) {
                                return;
                            }
                            result.events
                                .filter(({ event: { data, method, section }, phase }: EventRecord) => section === 'system' || section === 'imbueProposals')
                                .forEach(({ event: { data, method, section }, phase }: EventRecord): BasicTxResponse => {
                                    transactionState.transactionHash = extrinsic.hash.toHex();

                                    if (method === 'ExtrinsicSuccess') {
                                        transactionState.status = true;
                                        return transactionState;
                                    } else if (method === 'ExtrinsicFailed') {
                                        transactionState.status = false;
                                        return transactionState;
                                    }
                                    return transactionState;
                                });

                            if (result.isError) {
                                transactionState.txError = true;
                                return transactionState;
                            }

                            if (result.isCompleted) {
                                unsubscribe();
                                return transactionState;
                            }
                            return transactionState;
                        });
                    });
        } catch (error) {
            if (error instanceof Error) {
                transactionState.errorMessage = error.message;
            }
            transactionState.txError = true;
            return transactionState;
        }
        return transactionState;
    }

    handleError(transactionState: BasicTxResponse, dispatchError: DispatchError): BasicTxResponse {
        try {
            let errorMessage = polkadot.getDispatchError(dispatchError);
            transactionState.errorMessage = errorMessage;
            transactionState.txError = true;
        } catch (error) {
            if (error instanceof Error) {
                transactionState.errorMessage = error.message;
            }
            transactionState.txError = true;
        } finally {
            return transactionState;
        }
    }

    public async getProject(projectId: string | number) {
        const project: Project = await utils.fetchProject(projectId);
        return await this.convertToOnChainProject(project);
    }

    async convertToOnChainProject(project: Project) {
        const projectOnChain: any = (await this.imbueApi.imbue?.api.query.imbueProposals.projects(project.chain_project_id)).toHuman();
        const convertedProject: ProjectOnChain = {
            id: projectOnChain.milestones[0].projectKey,
            name: projectOnChain.name,
            logo: projectOnChain.logo,
            website: projectOnChain.website,
            description: project.description,
            requiredFunds: BigInt(projectOnChain.requiredFunds.replaceAll(",","")),
            requiredFundsFormatted: (projectOnChain.requiredFunds.replaceAll(",","") / 1e12),
            withdrawnFunds: BigInt(projectOnChain.withdrawnFunds.replaceAll(",","")),
            currencyId: projectOnChain.currencyId as Currency,
            milestones: projectOnChain.milestones as Milestone[],
            contributions: projectOnChain.contributions as Contribution[],
            initiator: projectOnChain.initiator,
            createBlockNumber:  BigInt(projectOnChain.createBlockNumber.replaceAll(",","")),
            approvedForFunding: projectOnChain.approvedForFunding,
            fundingThresholdMet: projectOnChain.fundingThresholdMet,
            cancelled: projectOnChain.cancelled,
        };
        return convertedProject;
    }

    public async getProjectState(projectOnChain: ProjectOnChain, user: User):Promise<ProjectState> {

        let projectState = ProjectState.PendingProjectApproval;
        let userIsInitiator = await this.isUserInitiator(user, projectOnChain);
        let projectInContributionRound = false;
        let projectInVotingRound = false;
        const lastHeader = await this.imbueApi.imbue.api.rpc.chain.getHeader();
        const currentBlockNumber = lastHeader.number.toBigInt();
        const rounds: any = await (await this.imbueApi.imbue.api.query.imbueProposals.rounds.entries());
     

        for (var i = Object.keys(rounds).length - 1; i >= 0; i--) {
            const [id, round] = rounds[i];
            const readableRound = round.toHuman();
            const roundStart = BigInt(readableRound.start.replaceAll(",", ""));
            const roundEnd = BigInt(readableRound.end.replaceAll(",", ""));
            const ProjectExistsInRound = readableRound.projectKeys.includes(projectOnChain.milestones[0].projectKey)

            if (roundStart < currentBlockNumber && roundEnd > currentBlockNumber && ProjectExistsInRound) {
                if (projectOnChain.approvedForFunding && readableRound.roundType == RoundType[RoundType.ContributionRound]) {
                    projectInContributionRound = true;
                    break;
                } else if (projectOnChain.fundingThresholdMet && readableRound.roundType == RoundType[RoundType.VotingRound]) {
                    projectInVotingRound = true;
                    break;
                }
            }
        }

        if (projectOnChain.fundingThresholdMet) {
            // Initators cannot contribute to their own project
            if (userIsInitiator) {
                if (projectInVotingRound) {
                    projectState = ProjectState.PendingMilestoneApproval;
                } else if (projectInContributionRound) {
                    projectState = ProjectState.OpenForContribution;
                }
            } else if (projectInVotingRound) {
                projectState = ProjectState.OpenForVoting;
            } else {
                projectState = ProjectState.PendingMilestoneSubmission;
            }
        } else if (!userIsInitiator && projectInContributionRound) {
            projectState = ProjectState.OpenForContribution;
        } else {
            // Project not yet open for funding
            if (projectOnChain.approvedForFunding && !projectInContributionRound) {
                projectState = ProjectState.PendingFundingApproval;
            } else if (userIsInitiator) {
                if (projectInContributionRound) {
                    projectState = ProjectState.OpenForContribution;
                } else {
                    projectState = ProjectState.PendingProjectApproval;
                }
            } else {
                projectState = ProjectState.PendingProjectApproval;
            }
        }
        return projectState;
    }

    public async isUserInitiator(user:User, projectOnChain: ProjectOnChain): Promise<boolean> {
        let userIsInitiator = false;
        const isLoggedIn = (user && user.web3Accounts != null)
        if (isLoggedIn) {
            user.web3Accounts.forEach(web3Account => {
                if (web3Account.address == projectOnChain.initiator) {
                    userIsInitiator = true;
                }
            });
        }
        return userIsInitiator;
    }
};

export default ChainService;

