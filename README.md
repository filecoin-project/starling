# Starling

A command-line interface for simplified, coordinated, decentralized storage on the Filecoin network. This is a work in progress and is not yet production-ready. Use at your own risk.


## Development

To run locally

```js
> npm install
```

During development it’s convenient to make the symlink on our path point to the index.js we’re actually working on, using `npm link`.

```js
> npm link
```

Test by running

```js
> starling <command>
```

### database

Starling uses an [sqlite3](https://www.npmjs.com/package/sqlite3) database. The db is created in `HOME/.starling/starling.db`

## API Address Config

In order to connect to a filecoin node, create a `.env` file in the root directory of the project with the following variables:

```j
LOTUS_URL=ws://<ip address of Filecoin node>/rpc/v0
LOTUS_AUTH_TOKEN=<Lotus RPC API authorization token with admin permissions>
```

## Commands

Modify the config file `HOME/.starling/config.json`

```js
> starling config
```

Store a single file

```js
> starling store full/path/to/file
```

Store a folder

```js
> starling store full/path/to/folder
```

Launch interactive monitoring interface

```js
> starling monitor

// up/down keys: scroll through the list
// ^S sort by size, ^V sort by filename
// ^F: filter all files
```

Generate a CSV report of all files stored

```js
// outputs file in the working directory
> starling list

// outputs file in the specified directory
> starling list <path>
```

Generate a CSV report of file fixity

```js
// outputs file in the working directory
> starling verify

// outputs file in the specified directory
> starling verify <path>
```

Output the version number

```js
> starling --version | -v
```

Output usage information

```js
> starling --help | -h | help

> starling [command] --help
```
