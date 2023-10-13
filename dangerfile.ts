/* eslint-disable no-plusplus */
// eslint-disable-next-line import/no-extraneous-dependencies
import { danger, warn, markdown } from 'danger';

const bigMRThreshold = 30;
let errorCount = 0;

const changesCount = +danger.gitlab.mr.changes_count;

if (changesCount > bigMRThreshold) {
  warn(`:exclamation: Big PR (${++errorCount})`);
  markdown(
    `> (${errorCount}) : Pull Request size seems relatively large. If Pull Request contains multiple changes, split each into separate PR will helps faster, easier review.`
  );
}

const packageChanged = danger.git.modified_files.includes('package.json');
const lockfileChanged = danger.git.modified_files.includes('yarn.lock');

if (packageChanged && !lockfileChanged) {
  const idea = 'Perhaps you need to run `yarn install`?';

  warn(`${'Changes were made to package.json, but not to yarn.lock'} - <i>${idea}</i>`);
}
