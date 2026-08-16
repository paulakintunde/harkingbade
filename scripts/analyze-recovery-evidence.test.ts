import { describe, expect, it } from 'vitest';
import {
  aggregateSourceRows,
  normalizeLegacyPath,
  parseCsv,
} from './analyze-recovery-evidence.mjs';

describe('recovery evidence import', () => {
  it('parses quoted CSV fields and escaped quotes', () => {
    const rows = parseCsv('Page,Clicks,Note\n"/old,page/",12,"A ""quoted"" note"\n');
    expect(rows).toEqual([{ page: '/old,page/', clicks: '12', note: 'A "quoted" note' }]);
  });

  it('normalizes full URLs, queries, and trailing slashes', () => {
    expect(normalizeLegacyPath('https://www.harkingbade.com/example?source=old')).toBe('/example/');
    expect(normalizeLegacyPath('/')).toBe('/');
  });

  it('aggregates duplicate path metrics without changing raw rows', () => {
    const rows = parseCsv('Top pages,Clicks,Impressions,Position\n/one/,2,20,4\n/one/?x=1,3,30,6\n');
    const result = aggregateSourceRows(rows, {
      label: 'GSC test',
      pathHeaders: ['top pages'],
      metrics: {
        searchConsoleClicks: ['clicks'],
        searchConsoleImpressions: ['impressions'],
        searchConsolePosition: ['position'],
      },
    });
    expect(result.byPath.get('/one/')).toEqual({
      searchConsoleClicks: 5,
      searchConsoleImpressions: 50,
      searchConsolePosition: 5.2,
    });
    expect(rows).toHaveLength(2);
  });
});
