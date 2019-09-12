# Starling

A command-line interface for simplified, coordinated, decentralized storage on the Filecoin network. This is a work in progress – MVP ships October 5th, and this code is not production-ready. Use at your own risk.

```
      .. .
     .... ..
  ...... .. ... . .
    . ... ....... ... ..
         .... .. .. ....
              .........

```

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

### Logs

Logs are located in `HOME/.starling/logs/starling.log`

## Commands

Modify the config file `HOME/.starling/config.json`

```js
> starling config
```

Store a single file

```js
> starling store path/to/file.jpg
```

Store a folder

```js
> starling store path/to/folder
```

Output the version number

```js
> starling --version | -v
```

Output usage information

```js
> starling --help | -h | help
```
