# bian2context

CLI tool to parse multiple OpenAPI (YAML/JSON) files from [BIAN](https://bian.org) and generate a compact summary for Domain-Driven Design (DDD) analysis.  
It extracts Service Domains, Entities, and Domain Events, with optional abbreviation compression to reduce token size for LLM prompts.

[![npm version](https://img.shields.io/npm/v/bian2context.svg)](https://www.npmjs.com/package/bian2context)
[![License](https://img.shields.io/npm/l/bian2context.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-green.svg)](https://nodejs.org/)

BIAN YAML and JSON files are available from the official repository. [https://github.com/bian-official/public](https://github.com/bian-official/public)



## Features

- Parse multiple `.yaml`, `.yml` or `.json` OpenAPI files.
- Extract:
  - Service Domains (SD)
  - Entities (E)
  - Domain Events (DE)
- Optional abbreviation compression to reduce token size for LLM prompts.
- Multiple output modes: `full`, `domains`, `entities`, `events`.
- Output formats: `txt`, `json`.
- Filter by Service Domain name.
- Custom output file naming.

---

## Installation
### Global installation

```bash
npm install -g bian2context
```

### Without installing (via `npx`)
```bash
npx bian2context ./src
```

Or as a project dependency:

```
npm install bian2context --save-dev
```

# Usage

```
bian2context [directory] [options]
```

Default behavior:

 - Reads all .yaml / .yml / .json files from the given directory.
 - Generates a compact text summary summary_compact.txt in the current folder.

## Options

|Flag|Description|Values / Example|Default|
|-|-|-|-|
|--content|	Type of content to export|	full, domains, entities, events|	full|
|--compress|	Apply abbreviations dictionary|	-|	false|
|--format|	Output format|	txt, json |	txt|
|--output|	Output filename	--output=myfile.txt|	Depends on content | type|
|--filter|	Filter by Service Domain substring	|--filter=card	| null|

# Examples

## Full (TXT, compressed)

```
#DICT
SD=Service Domain;E=Entity;DE=Domain Event;...

#DATA
SD=CardOps
E=CardAuth: Authorizes card payments
E=CardClr: Processes clearing of card tx
DE=CardCrtd
DE=CardUpdtd
```

## Domains only (JSON)

```
[
  "Card Operations",
  "Loan Syndication",
  "Customer Tax Handling"
]
```

## Abbreviation Dictionary

The tool uses a configurable dictionary to shorten common terms in BIAN models.

Example:

```
"Service Domain" → "SD"
"Description" → "D"
"Account" → "Acct"
"Customer" → "Cust"
"Transaction" → "Tx"
```

# License

MIT License

Copyright (c) 2025 Enrique Ismael Mendoza Robaina

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell     
copies of the Software, and to permit persons to whom the Software is         
furnished to do so, subject to the following conditions:                      

The above copyright notice and this permission notice shall be included in    
all copies or substantial portions of the Software.                           

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR    
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,      
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE   
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER        
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN     
THE SOFTWARE.
