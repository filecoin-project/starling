---
layout: default
title: Commands
---

# Commands

This section describes Starling's various commands and functions available via its command-line interface. Remember to always type starling before invoking an argument in the command-line.

If you don’t understand a word used in the documentation, try looking it up in Starling’s [glossary](resources.html) under the “Resources” section.


## Table of contents

<table class="table table-hover">
  <thead>
    <tr>
      <th scope="col">I would like to...</th>
      <th scope="col">command</th>
    </tr>
  </thead>
  <tbody>
    <tr class="clickable-row" data-href="#help">
      <td>Read documentation in the command-line</td>
      <td>help</td>
    </tr>
    <tr class="clickable-row" data-href="#config">
      <td>Configure global preferences for Starling</td>
      <td>config</td>
    </tr>
    <tr class="clickable-row" data-href="#store">
      <td>Store a file or folder</td>
      <td>store</td>
    </tr>
    <tr class="clickable-row" data-href="#monitor">
      <td>Know what Starling is doing</td>
      <td>monitor</td>
    </tr>
    <tr class="clickable-row" data-href="#list">
      <td>See a list of what I have stored</td>
      <td>list</td>
    </tr>
    <tr class="clickable-row" data-href="#get">
      <td>Download a file I have stored</td>
      <td>get</td>
    </tr>
    <tr class="clickable-row" data-href="#verify">
      <td>Verify the authenticty of my files</td>
      <td>verify</td>
    </tr>
    <tr class="clickable-row" data-href="#retry">
      <td>Retry a failed upload</td>
      <td>retry</td>
    </tr>
    
    
  </tbody>
</table>

<br><br>

## config
Syntax: `starling config`

About: Configures the two global settings for Starling: the number of redundant copies of the data you’d like to store on the Filecoin Network, and the amount you’d like to pay (in USD) per TB of data.

Arguments: none

<br><br>

## get
Syntax: `starling get [minerID] [contentID]`

About: Queues downloading a specific file stored by a specific miner on the Filecoin Network.


<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 17.5%">argument</th>
      <th scope="col" style="width: 17.5%">required</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">minerID</th>
      <td>yes</td>
      <td>Specifices precisely which Filecoin miner you would like to download from. Can be found in the output of the `list` command's CSV.</td>
    </tr>
    <tr>
      <th scope="row">contentID</th>
      <td>yes</td>
      <td>Specifies the particular file you would like to download. Can be found in the output of the `list` command's CSV.</td>
    </tr>
  </tbody>
</table>

<br><br>


## help 
Syntax: `starling help [command]`

About: Lists all available arguments.

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 17.5%">argument</th>
      <th scope="col" style="width: 17.5%">required</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">command</th>
      <td>no</td>
      <td>You can run the help command without any arguments (i.e. <code>starling help</code>), however if you supply the optional argument of any of starling's commands (i.e. <code>starling help get</code>), the help output will provide more specifics on that particular command.</td>
    </tr>
  </tbody>
</table>

<br><br>

## store
About: Queues the process of making storage deals with Filecoin miners on your behalf. `store` makes storage deals for the number of redundant copies and price per TB specified when you first installed Starling, or else updated using `config`.

Syntax: `starling store [path]`

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 17.5%">argument</th>
      <th scope="col" style="width: 17.5%">required</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">path</th>
      <td>yes</td>
      <td>full path to the file or folder you want to store</td>
    </tr>
  </tbody>
</table>

<br><br>


## list
Syntax: `starling list [path]`

About: Outputs a CSV file of all your content currently stored on the Filecoin Network.

### Arguments
<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 17.5%">name</th>
      <th scope="col" style="width: 17.5%">required</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">path</th>
      <td>no</td>
      <td>You can optionally supply as an argument a path to where you would like Starling to store the CSV it will output as a result of the <code>list</code> command. If no path is supplied, the CSV will be saved in your present working directory.</td>
    </tr>
  </tbody>
</table>


### Outputs

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 35%">name</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">content</th>
      <td>the original and unique filename of the content you stored with the miner</td>
    </tr>
    <tr>
      <th scope="row">Size</th>
      <td>the content size measured in bytes</td>
    </tr>
    <tr>
      <th scope="row">CID</th>
      <td>content identifier; a unique identifier for the content</td>
    </tr>
    <tr>
      <th scope="row">Miner ID</th>
      <td>a unique identifier for the miner storing the content</td>
    </tr>
    <tr>
      <th scope="row">Deal commencement</th>
      <td>the date the storage deal was made in YYYY-MM-DD format</td>
    </tr>
  </tbody>
</table>

<br><br>

## monitor
About: Launches an interactive interface for monitoring your content being stored or retrieved by miners on the Filecoin Network.

Syntax: `starling monitor`

### Interactive keyboard shortcuts:

- `^S` - sort list by jobId
- `^F` - find a job by jobId
- `^H` - hide all queued jobs

<br>

### Outputs

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 35%">name</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Files stored in the network</th>
      <td>the number of files stored on the Filecoin Network</td>
    </tr>
    <tr>
      <th scope="row">number of miners</th>
      <td>the number of miners storing or retrieving your files</td>
    </tr>
    <tr>
      <th scope="row">Storage space used</th>
      <td>the amount of storage space currently being used (in TB)</td>
    </tr>
    <tr>
      <th scope="row">Wallet balance</th>
      <td>the balance of your Filecoin wallet</td>
    </tr>
    <tr>
      <th scope="row">Active jobs</th>
      <td>the number of active jobs currently being performed by miners</td>
    </tr>
    <tr>
      <th scope="row">Queued jobs</th>
      <td>the number of queued jobs waiting for miners to perform</td>
    </tr>
    <tr>
      <th scope="row">jobId</th>
      <td>a unique identifier for the job (i.e. deal or transaction) between you and a miner</td>
    </tr>
    <tr>
      <th scope="row">type</th>
      <td>The type of job. This has two possible values: <code>upload</code>, or <code>download</code>.</td>
    </tr>
    <tr>
      <th scope="row">status</th>
      <td>Indicates the status of the job. There are four potential values. <code>queued</code> means the job is waiting to run. <code>sync</code> means that data is actively being uploaded or download to/from a miner in the Filecoin network. <code>seal</code> means that the miner has fully recieved the data you are storing, and is generating the Filecoin proofs for the first time, and embedding these in the block the data is stored in. Lastly <code>verify</code> means that the miner is checking the vailidty of the proofs.</td>
    </tr>
    <tr>
      <th scope="row">content</th>
      <td>the original and unique filename of the content you’d like the miner to store or retrieve</td>
    </tr>
    <tr>
      <th scope="row">size</th>
      <td>the content size measured in bytes</td>
    </tr>
    <tr>
      <th scope="row">elapsed time</th>
      <td>the amount of time that has passed while the job has been active in HH:MM:SS format</td>
    </tr>
  </tbody>
</table>

<br><br>


## retry

About: retries any failed uploads or downloads

Syntax: `starling retry`

Arguments: none

<br><br>

## verify
About: Outputs a CSV file of your content stored on the Filecoin Network which you can use to verify the integrity of data.

Syntax: `starling verify [path]`

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 17.5%">argument</th>
      <th scope="col" style="width: 17.5%">required</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">path</th>
      <td>no</td>
      <td>You can optionally supply as an argument a path to where you would like Starling to store the CSV it will output as a result of the <code>verify</code> command. If no path is supplied, the CSV will be saved in your present working directory.</td>
    </tr>
  </tbody>
</table>


### Outputs

<table class="table table-sm">
  <thead>
    <tr>
      <th scope="col" style="width: 35%">name</th>
      <th scope="col" style="width: 65%">info</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Content</th>
      <td>the original and unique filename of the stored content you’d like to verify</td>
    </tr>
    <tr>
      <th scope="row">CID</th>
      <td>content identifier; a unique identifier for the content being stored</td>
    </tr>
    <tr>
      <th scope="row">Miner ID</th>
      <td>a unique identifier for the miner storing the content</td>
    </tr>
    <tr>
      <th scope="row">Deal commencement</th>
      <td>the date the storage deal was made in YYYY-MM-DD format</td>
    </tr>
    <tr>
      <th scope="row">Original commD value</th>
      <td>the original sector data commitment</td>
    </tr>
    <tr>
      <th scope="row">Original commR value</th>
      <td>the original replica commitment</td>
    </tr>
    <tr>
      <th scope="row">Original commRStar value</th>
      <td></td>
    </tr>
    <tr>
      <th scope="row">Date of last check</th>
      <td>the date the content was last checked for verification</td>
    </tr>
    <tr>
      <th scope="row">Recalculated commD value</th>
      <td>the sector data commitment recalculated for verification</td>
    </tr>
    <tr>
      <th scope="row">Recalculated commR value</th>
      <td>the sector data commitment recalculated for verification</td>
    </tr>
    <tr>
      <th scope="row">Recalculated commRStar value</th>
      <td></td>
    </tr>
    <tr>
      <th scope="row">Verification result</th>
      <td>compares commitments (i.e. commD, commR, commStar) to verify that content has been continuously stored in accordance with deals made. If the value is listed as <code>pass</code>, then your content is safe - the proofs all match the originally calculated values. If the value is listed as <code>fail</code>, then there is a problem – the recalculated proofs do not match the orginal proofs.</td>
    </tr>
  </tbody>
</table>


  <script type="text/javascript">
jQuery(document).ready(function($) {
    $(".clickable-row").click(function() {
        window.location = $(this).data("href");
    });
});
  </script>