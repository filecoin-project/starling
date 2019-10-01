---
layout: default
title: Getting Started
---

# Getting Started
Before you can install Starling, you will need to make sure you have a few things installed first. 

1) First up is Filecoin – the underlying protocol that makes Starling possible. The Filecoin project is still early in development, so currently there isn’t yet an easy-to-use installer, package, or wizard yet. The best and most up-to-date instructions to follow are in Filecoin’s getting started wiki. If you are running Linux, installing from binary is probably easiest, but on any other platform and you will need to install from source. Follow these instructions all the way through the end, and you will have a functional Filecoin node.

2) Next is Node.js – the framework that Starling is built in. You can find Linux binaries, and installers for Windows and macOS on the Node.js downloads page. 

Now that you have Filecoin and Node.js up and running, getting Starling installed is as easy as typing and entering the following command:

<code>
	$ npm install -g starling
</code>

The first time you run Starling, you should have decided on the two following factors: how many redundant copies you would like to store in the network, and what is the maximum price you are willing to pay to store one Terabyte (TB) of data. You can set these parameters by running the following command:

<code>
	$ starling config
</code>

Next, let’s test storing a folder of files using Starling. Go ahead and download some test files here. Note that you’ll have to prepare your files before storing them by breaking them up into appropriate sized chunks smaller than 256 mebibytes (MiB), equivalent to 1.049e+6 bytes. For Linux and Unix users, the split command is a great option for splitting your files—check out this article for examples. In the future, Staring hopes to handle data chunking for you.

To store a file or directory, just type:

<code>
	$ starling store [path/to/your/folder]
</code>