import { Component } from '@angular/core';
import { gtcrDecode } from '@kleros/gtcr-encoder';
import { AppService } from './app.service';
import { KlerosService } from './kleros.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  title = 'my-app';

  public items: any[] = [];

  constructor(
    private appService: AppService,
    private klerosService: KlerosService
  ) {}

  ngOnInit() {
    this.getDisplayedItems().then(console.log).catch(console.error);
  }

  async getDisplayedItems() {
    let items = await this.appService.getTagList();

    let metadata = await this.klerosService.getMetadata();
    const metadataByTime = {
      byBlockNumber: {} as any,
      byTimestamp: {} as any,
      address: metadata[0].address,
    };
    metadata.forEach((file) => {
      if (file.error) return;
      metadataByTime.byBlockNumber[file.blockNumber] = file;
      metadataByTime.byTimestamp[file.timestamp] = file;
    });

    console.log(metadata);

    let displayItems = items
      .map((item, i) => {
        let decodedItem: any;
        const errors = [];
        const { columns } =
          metadataByTime.byTimestamp[
            this.takeLower(
              Object.keys(metadataByTime.byTimestamp),
              (item as any).timestamp
            )
          ].metadata;
        try {
          decodedItem = gtcrDecode({ values: item.data, columns });
          // eslint-disable-next-line no-unused-vars
        } catch (err) {
          errors.push(`Error decoding item ${item.ID}`);
          console.warn(`Error decoding item ${item.ID}: ${err}`);
        }

        // Return the item columns along with its TCR status data.
        return {
          metadata: {},
          tcrData: {
            ...item, // Spread to convert from array to object.
          },
          columns: columns.map(
            (col: any, i: any) => ({
              value: decodedItem && decodedItem[i],
              ...col,
            }),
            { key: i }
          ),
          errors,
        };
      })
      .sort(({ tcrData: tcrDataA }, { tcrData: tcrDataB }) => {
        if (!tcrDataA || !tcrDataB) return 0;
        if (!(tcrDataA as any).resolved && (tcrDataB as any).resolved)
          return -1;
        if ((tcrDataA as any).resolved && !(tcrDataB as any).resolved) return 1;
        return 0;
      });

    let promises = [];
    for (let item of displayItems) {
      promises.push(
        this.klerosService.getMetadataEvidence(item.columns[0].value)
      );
    }

    let metadataEvidence = await Promise.all(promises);
    displayItems = displayItems.map((item, i) => {
      return {
        ...item,
        metadata: metadataEvidence[i],
      };
    });

    console.log(displayItems);

    this.items = displayItems;
  }

  private takeLower(list: any[], limit: number) {
    list = list.map((item) => Number(item));
    limit = Number(limit);
    let result = list[0];

    for (let i = 0; i < list.length; i++)
      if (list[i] > limit) {
        result = list[i - 1];
        break;
      }

    return result;
  }
}
