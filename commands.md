---
layout: default
title: Commands
---

# Commands

This section describes command-line arguments that you can provide to Starling. Remember to always type starling before invoking an argument in the command-line.

If you don’t understand a term, try looking it up in Starling’s [glossary]() under the “Resources” section.

## config
Configures the following global preferences for Starling:
1. The number of redundant copies of the data you’d like to store on the Filecoin Network.
2. The amount you’d like to pay (in USD) per TB of data.

Syntax: `starling config`

## get
Queues downloading a specific file stored by a specific miner on the Filecoin Network.

Syntax: `starling get [minerID] [contentID]`
- `minerID` - unique identifier for the device providing storage
- `contentID` - unique identifier for the file (i.e. piece CID) being stored

## help
Lists all available arguments.

Syntax: `starling help`

## list
Outputs a CSV file of all your content currently stored on the Filecoin Network.

Syntax: `starling list [path]`
- `path` - [OPTIONAL - blank by default] - full file path where the CSV file will be saved

Outputs:
- `Content` - the original and unique filename of the content you stored with the miner
- `Size` - the content size measured in bytes 
- `CID` - content identifier; a unique identifier for the content
- `Miner ID` - a unique identifier for the miner storing the content
- `Deal commencement` - the date the storage deal was made in YYYY-MM-DD format

## monitor
Launches an interactive interface for monitoring your content being stored or retrieved by miners on the Filecoin Network.

Syntax: `starling monitor`

Interactive keyboard shortcuts:
- `^S` - sort list by jobId
- `^F` - find a job by jobId
- `^H` - hide all queued jobs

Outputs:
- `Files stored in the network` - the number of files stored on the Filecoin Network
- `\# of miners` - the number of miners storing or retrieving your files
- `Storage space used` - the amount of storage space currently being used (in TB)
- `Wallet balance` - the balance of your Filecoin wallet
- `Active jobs` - the number of active jobs currently being performed by miners
- `Queued jobs` - the number of queued jobs waiting for miners to perform
- `jobId` - a unique identifier for the job (i.e. deal or transaction) between you and a miner
- `type` - the type of job
  - `upload` - miner stores job content
  - `download` - miner retrieves job content
- `status` - the status of the content
  - `sync` - miner is syncing transaction to the Filecoin Network
  - `seal` - miner is sealing sector, replicating content bit-for-bit
  - `verify` - miner is checking validity of proofs
  - `queued` - job is waiting to run
- `content` - the original and unique filename of the content you’d like the miner to store or retrieve
- `size` - the content size measured in bytes 
- `elapsed time` - the amount of time that has passed while the job has been active in HH:MM:SS format

## retry

Syntax: `starling retry`

## store
Queues the process of making storage deals with Filecoin miners on your behalf. 

Syntax: `starling store [path]`
- `path` - full path of a file or directory

Note: `store` makes storage deals for the number of redundant copies and price per TB specified when you first installed Starling, or else updated using config.

## verify
Outputs a CSV file of your content stored on the Filecoin Network which you can use to verify the integrity of data.

Syntax: `starling verify [path]`
- `path` - [OPTIONAL - blank by default] - full file path where the CSV file will be saved

Outputs:
- `Content` - the original and unique filename of the stored content you’d like to verify
- `CID` - content identifier; a unique identifier for the content being stored
- `Miner ID` - a unique identifier for the miner storing the content
- `Deal commencement` - the date the storage deal was made in YYYY-MM-DD format
- `Original commD value` - the original sector data commitment
- `Original commR value` - the original replica commitment
- `Original commRStar value
- `Date of last check` - the date the content was last checked for verification
- `Recalculated commD value` - the sector data commitment recalculated for verification
- `Recalculated commR value` - the sector data commitment recalculated for verification
- `Recalculated commRStar value`
- `Verification result` - compares commitments (i.e. commD, commR, commStar) to verify that content has been continuously stored in accordance with deals made
  - `pass` - all original values match the recalculated values
  - `fail` - one or more original values do not match the recalculated values