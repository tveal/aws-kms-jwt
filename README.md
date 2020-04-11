# cf-deps

CLI tool for publishing serverless CloudFormation dependencies to a repo store
- Finds cf refs (`${cf:stackName.output}`) from yaml (or yml) files
- Makes a list of stackNames (removes duplicates)
- Commit list of stackNames to git repo for aggregated storage of stack dependencies

Sample stack dependency json:
```json
{
    "stack-name-a": [],
    "stack-name-b": [
        "stack-name-a"
    ],
    "stack-name-c": [
        "stack-name-b"
    ],
    "stack-name-d": [
        "stack-name-a",
        "stack-name-c"
    ]
}
```

If you build a new stack, say "stack-name-e", and run cf-deps in it's respective CI/CD build, then it would add `"stack-name-e": [ /** list of cf stackName refs **/ ]` to the json sample above. From the living centralized dependency json, you have a quick one-stop-shop for deployment dependencies. Further automation can be built on top of this to generate deploy groups in order of their dependencies.

## Usage

Be sure to checkout `cf-deps help`

**With ENV Variables**
```
CF_DEPS_REMOTE_GIT=<git-clone-url-for-storage-repo> \
CF_DEPS_JSON_FILE=<json-file-to-store-deps-in> \
    cf-deps
```

**With CLI Options**
```
cf-deps \
    -r <git-clone-url-for-storage-repo> \
    -f <json-file-to-store-deps-in>
```

## Known Limitations

Sometimes your projects can have complex CloudFormation references that the RegExp
cannot account for; An example, a cf ref to itself in a different region, like so:

```
${cf.${self:custom.replicationRegion}:${self:service}-${opt:stage}.BucketName}
```
In this case, a stackName, "custom" would be collected by `cf-deps`, but this isn't
realistic. Instead, you can add "custom" as an excludes. See `cf-deps help`.

---

## Working with the Source Code

Install the things and link cf-deps for CLI use:
```
npm ci
npm link
```

### Local Git Server

This source code includes a simple local git server (requires docker and docker-compose)
which can make testing easier and faster.

#### Build and Run

1. Build the needful
    ```bash
    docker-compose build
    ```
2. Run the needful
    ```bash
    docker-compose up
    ```

With the docker-compose stack running, you can clone the repo(s) that are in the
local git server

```bash
cd /tmp && git clone git://localhost/cf-deps-store
```

On startup (aka, during `docker-compose up`), the git-server initiates git repos
from the folders in the [test/git-server/seed-repos](test/git-server/seed-repos/). You can
then clone the repo(s), change, commit, and push them as needed while the server
is running. Restart the server and start over from the seed-state.

#### Stop/Start

Currently, the **git-server cannot handle start/stop** of the container, so you have
to make sure to remove the container before starting again; simply run:

```bash
docker-compose down
```

Then you can run the needful again:
```bash
docker-compose up
```