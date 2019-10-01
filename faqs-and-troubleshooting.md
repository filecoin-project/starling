---
layout: default
title: FAQs and Troubleshooting
---

# FAQs and Troubleshooting

## FAQs
### What is Filecoin?
Filecoin is a decentralized storage network that turns cloud storage into a peer-to-peer algorithmic market. Miners earn the native protocol token (also called “Filecoin”) by providing data storage and/or retrieval. Conversely, clients pay miners to store or distribute data and to retrieve it. “Filecoin” can refer to a) the network, b) the protocol, c) the token powering the network, and d) the project. For more details, please see [https://filecoin.io/faqs/](https://filecoin.io/faqs/)

### What is Starling?
Starling is a decentralized storage application built on Filecoin that is designed for use in archival settings where the ability to demonstrate the authenticity of a file over the course of time is of paramount importance. For more details, please see [http://starlingstorage.io/overview.html](http://starlingstorage.io/overview.html)

### What is decentralized storage?
Decentralized storage is a model of online storage where data is stored on multiple independent computers. The servers used are hosted by individual users or groups, rather than a single company like Amazon, Google, or Microsoft, as is the case with centralized cloud storage.

### Is my data secure with Starling?
While nothing is 100% secure, Starling is built on Filecoin, which utilizes powerful cryptography and mathematical protocols to store your data, making it extremely difficult for malicious actors to manipulate. Furthermore, Filecoin’s decentralized network ensures that even if one device fails, all of your data remains secure elsewhere. This resilience and security have become some of the hallmarks of why decentralized storage networks are considered to be far safer than centralized storage.

### Does Starling perform fixity checking?
The short answer is: yes. Fixity is the assurance that data has remained unchanged in the preservation sense and is synonymous with bit-level integrity. The most widely used tools for creating fixity information are cryptographic hashes (e.g. MD5, SHA-512). In the Filecoin protocol, miners must convince clients that they stored the data they were paid to store bit-for-bit; in practice, miners do this by generating proofs on an ongoing basis that the network and Starling verifies. Starling’s verify function is effectively a way of auditing these fixity checks (i.e. proofs).

## Known Issues
For known issues, please see [https://github.com/filecoin-project/starling/issues](https://github.com/filecoin-project/starling/issues)