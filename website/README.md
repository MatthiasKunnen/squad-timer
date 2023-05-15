# Squad Timer website
The frontend for the squad timer

## Development
1. Enable corepack `corepack enable`
1. Install packages `yarn install`
1. Run `git update-index --skip-worktree src/environments/environment.ts src/environments/environment.generated.ts`  
   This prevents git from registering changes to these files.
1. Edit `src/environments/environment.ts` as your development environment requires.
1. Run `yarn run start`. The app will be on <http://localhost:4250>.
