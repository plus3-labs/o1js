import { Experimental, Field, Mina, Party } from 'snarkyjs';
import { VotingAppParams } from './factory';

import { Membership_ } from './membership';

import { Voting_ } from './voting';

/**
 * Function used to deploy a set of contracts for a given set of preconditions
 * @param contracts A set of contracts to deploy
 * @param params A set of preconditions and parameters
 */
export async function deployContracts(
  contracts: {
    voterContract: Membership_;
    candidateContract: Membership_;
    voting: Voting_;
  },
  params: VotingAppParams,
  voterRoot: Field,
  candidateRoot: Field,
  votesRoot: Field
): Promise<any> {
  let Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  let feePayer = Local.testAccounts[0].privateKey;

  let { voterContract, candidateContract, voting } = contracts;

  console.log('deploying set of 3 contracts');
  let tx = await Mina.transaction(feePayer, () => {
    Party.fundNewAccount(feePayer, {
      initialBalance: Mina.accountCreationFee().add(Mina.accountCreationFee()),
    });

    voting.deploy({ zkappKey: params.votingKey });
    voting.committedVotes.set(votesRoot);
    voting.accumulatedVotes.set(Experimental.Reducer.initialActionsHash);

    candidateContract.deploy({ zkappKey: params.candidateKey });
    candidateContract.committedMembers.set(candidateRoot);
    candidateContract.accumulatedMembers.set(
      Experimental.Reducer.initialActionsHash
    );

    voterContract.deploy({ zkappKey: params.voterKey });
    voterContract.committedMembers.set(voterRoot);
    voterContract.accumulatedMembers.set(
      Experimental.Reducer.initialActionsHash
    );
  });

  tx.send();

  console.log('successfully deployed contracts');
  return { voterContract, candidateContract, voting };
}
