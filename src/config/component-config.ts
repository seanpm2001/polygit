/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as bower from 'bower';

import {LatestRepoConfig, ParsedPath, RepoConfig} from '../path/path';

const GITHUB_URL = 'github.com/';

export async function configForPath(path: ParsedPath): Promise<RepoConfig> {
  const component = path.component;
  let configForComponent: RepoConfig|null = null;
  for (const config of path.repoConfigs) {
    if (config.component === component) {
      configForComponent = config;
      break;
    }
  }
  if (!configForComponent || !configForComponent.org) {
    const repoFromBower =
        await new Promise<bower.LookupResponse>((resolve, reject) => {
          bower.commands.lookup(component)
              .on('end', (results: bower.LookupResponse) => resolve(results))
              .on('error', (err: Error) => reject(err));
        });

    const githubUrlIndex = repoFromBower.url.indexOf(GITHUB_URL);
    if (githubUrlIndex === -1) {
      throw new Error(`Non-github URL returned from bower for "${component
                      }", unable to resolve.`);
    }

    const githubOffset = githubUrlIndex + GITHUB_URL.length;

    const org = repoFromBower.url.slice(
        githubOffset, repoFromBower.url.indexOf('/', githubOffset));

    if (configForComponent) {
      configForComponent.org = org;
    } else {
      const latest:
          LatestRepoConfig = {kind: 'latest', component: component, org};
      configForComponent = latest;
    }
  }
  if (!configForComponent) {
  throw new Error(`Unable to determine config for ${path.component}`);
  }
  return configForComponent;
}