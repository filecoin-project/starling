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

## API Address Config

The default API Address is localhost, in cases where Starling and the filecoin node are on the same machine. In order to connect to a remote filecoin node, create a `.env` file in the root directory of the project and insert the API Adress as such:

```j
apiAddr='/ip4/<Filecoin Node IP Address>/tcp/3453/'
```

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

Launch interactive monitoring interface

```js
> starling monitor

// up/down keys: scroll through the list
// ^H: hide/show queued files
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

Retry uploading the failed jobs

```js
> starling retry
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
