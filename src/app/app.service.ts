import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { lastValueFrom, map } from 'rxjs';
import { DISPUTE_STATUS } from './app.config';
import * as ethers from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private TCR_ADDRESS = '0xba0304273a54dfec1fc7f4bccbf4b15519aecf15';

  constructor(private apollo: Apollo) {}

  getTagList() {
    let result = this.apollo
      .query({
        query: gql`
          query classicRegistryItemsQuery(
            $skip: Int
            $first: Int
            $orderDirection: OrderDirection
            $where: Item_filter
          ) {
            items(
              skip: $skip
              first: $first
              orderDirection: $orderDirection
              orderBy: latestRequestSubmissionTime
              where: $where
            ) {
              itemID
              status
              data
              requests(
                first: 1
                orderBy: submissionTime
                orderDirection: desc
              ) {
                disputed
                disputeID
                submissionTime
                resolved
                requester
                challenger
                rounds(first: 1, orderBy: creationTime, orderDirection: desc) {
                  appealPeriodStart
                  appealPeriodEnd
                  ruling
                  hasPaidRequester
                  hasPaidChallenger
                  amountPaidRequester
                  amountPaidChallenger
                }
              }
            }
          }
        `,
        variables: {
          skip: (Number(1) - 1) * 100,
          first: 100,
          orderDirection: 'desc',
          where: {
            registry: this.TCR_ADDRESS.toLowerCase(),
          },
        },
      })
      .pipe(
        map((res) => (res.data as any).items),
        map((data: any[]) => {
          console.log(data);

          return data.map(({ itemID, status: statusName, requests, data }) => {
            const { disputed, disputeID, submissionTime, rounds, resolved } =
              requests[0] ?? {};

            const {
              appealPeriodStart,
              appealPeriodEnd,
              ruling,
              hasPaidRequester,
              hasPaidChallenger,
              amountPaidRequester,
              amountPaidChallenger,
            } = rounds[0] ?? {};

            const currentRuling =
              ruling === 'None' ? 0 : ruling === 'Accept' ? 1 : 2;
            const disputeStatus = !disputed
              ? DISPUTE_STATUS.WAITING
              : resolved
              ? DISPUTE_STATUS.SOLVED
              : Number(appealPeriodEnd) > Date.now() / 1000
              ? DISPUTE_STATUS.APPEALABLE
              : DISPUTE_STATUS.WAITING;

            const graphStatusNameToCode: any = {
              Absent: 0,
              Registered: 1,
              RegistrationRequested: 2,
              ClearingRequested: 3,
            };

            return {
              ID: itemID,
              itemID,
              status: graphStatusNameToCode[statusName],
              disputeStatus,
              disputed,
              data,
              disputeID,
              submissionTime: ethers.BigNumber.from(submissionTime),
              hasPaid: [false, hasPaidRequester, hasPaidChallenger],
              currentRuling,
              appealStart: ethers.BigNumber.from(appealPeriodStart),
              appealEnd: ethers.BigNumber.from(appealPeriodEnd),
              amountPaid: [
                ethers.BigNumber.from(0),
                ethers.BigNumber.from(amountPaidRequester),
                ethers.BigNumber.from(amountPaidChallenger),
              ],
            };
          });
        })
      );
    return lastValueFrom(result);
  }
}
