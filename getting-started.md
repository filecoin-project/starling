---
layout: default
title: Getting Started
---

# Getting Started
Starling is powered by the [Filecoin](https://filecoin.io) protocol, and so before we can get started with installing and using Starling, we will need to install Filecoin, and get our node up and running. 


## Installing Filecoin
The Filecoin project is still early in development, so currently there isn’t yet an easy-to-use installer, package, or wizard yet. The best and most up-to-date instructions to follow are in Filecoin’s [wiki](https://docs.filecoin.io/go-filecoin-tutorial/Getting-Started.html). If you are running Linux, [installing from binary](https://docs.filecoin.io/go-filecoin-tutorial/Getting-Started.html#install-filecoin-and-its-dependencies) is probably easiest, but on any other platform and you will need to [install from source](https://docs.filecoin.io/go-filecoin-tutorial/Getting-Started.html#install-filecoin-and-its-dependencies). Follow these instructions all the way through the end, and you will have a functional Filecoin node.

## Installing NodeJS
Starling was written in the NodeJS framework, so in order to install and use Starling we will also need to install NodeJS. You can find Linux binaries, and installers for Windows and macOS on the [Node.js downloads page](https://nodejs.org/en/download/). 


Now that you have Filecoin and Node.js up and running, getting Starling installed is as easy as typing and entering the following command:

<code>
	npm install -g starling
</code>

The first time you run Starling, you should have decided on the two following factors: how many redundant copies you would like to store in the network, and what is the maximum price you are willing to pay to store one Terabyte (TB) of data. You can set these parameters by running the following command:

<code>
	starling config
</code>

Next, let’s test storing a folder of files using Starling. Go ahead and download some test files [here](). Note that you’ll have to prepare your files before storing them by breaking them up into appropriate sized chunks smaller than 256 mebibytes (MiB), equivalent to 1.049e+6 bytes. For Linux and Unix users, the split command is a great option for splitting your files—-check out [this article](https://www.linuxtechi.com/split-command-examples-for-linux-unix/) for examples. We will be integrateing data chunking into the next round of Starling's development so that you don't have to do this process manually.

To store a file or directory, just type:

<code>
	starling store [path/to/your/folder]
</code>

You're now up and running! Check out the [commands](commands.html) documentation for ideas on what to try next...
