# Open Directory

> Organize the world's information on Bitcoin

Open Directory lets you build resources like [Reddit](https://www.reddit.com), [Awesome Lists](https://github.com/sindresorhus/awesome) and [DMOZ](http://dmoz-odp.org) ontop of Bitcoin. With Open Directory you can:

* Create your own resource and earn money when people tip ([upvote](#voting))
* Incentivize quality submissions by sharing a portion of tips back to contributors ([tipchain](#tipchain))
* Organize an existing directory or fork it with 1-click and start your own ([easy exit policy](#forking))

Open Directory is an experiment to organize the world's information on Bitcoin (SV). What are you going to do with it?

### Start using the Open Directory

Open Directory is 100% Bitcoin native—which means it can be accessed from the [Bottle](https://bottle.bitdb.network) blockchain browser at [c://lkasjdflkajsdflkajsdflkajsdlfkajsdf](c://).

For convenience, it also runs on the web at [opendirectory.org](https://). To get started you just need a [Money Button](https://www.moneybutton.com) account.

### Start building with the Open Directory

Open Directory is open source in two ways.

1. You can view and modify the app's source code to spin up your own copy

2. The Open Directory Protocol is 100% open to build for your own use or implementation. Read about it below.



# Open Directory Protocol

> [Bitcom](https://bitcom.bitdb.network) protocol `1dirxA5oET8EmcdW4saKXzPqejmMXQwg2`

The Open Directory protocol is an open protocol for creating resources on Bitcoin (SV). If you've never heard of Bitcom protocols, [learn more here](https://bitcom.bitdb.network). The main key to understanding Bitcom protocols is they store data in the OP_RETURN of a Bitcoin transaction in a specific format. Here's a simple example:

<pre>
<strong style="color: #9B4DCA">1dirxA5oET8EmcdW4saKXzPqejmMXQwg2</strong>
<span style="color: #EB48AB">category.create</span>
<span style="color: #FF6384">name</span>
<em>Category Name Goes Here</em>
<span style="color: #FF6384">description</span>
Along with a *markdown* description
</pre>

Open Directory protocols have two primary forms, creating new items (categories and entries) and then doing things to those entries (edits, deletes, votes)


    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.update
    <category_txid>
    name
    <name>
    description
    <description
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.delete
    <category_txid>

### Entry

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.create
    <category_txid>
    name
    <name>
    description
    <description>
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.update
    <entry_txid>
    name
    <name>
    description
    <description
    
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    entry.delete
    <entry_txid>

### Vote

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    vote
    <txid>

### Moderation (proposed)

There are three kinds of moderation

* 0 - open (anyone can do anything)
* 1 - restricted (only moderator can delete)
* 2 - preapproved (everything must be approved)

Moderation could be added with four changes:

Step 1a. Whoever creates category is owner and default moderator

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.create
    name
    <name>
    description
    <description>


Step 1b. Can also use AIP to sign authorship

    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    category.create
    name
    <name>
    description
    <description>
    |
    15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
    BITCOIN_ECDSA
    <signing_address>
    <signature>

Step 2a. Enable open moderation

    # enable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.set
    <category_txid>
    0

Step 2a. Enable restricted moderation

    # enable moderated
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.set
    <category_txid>
    2


Step 3. Moderation now requires changes to be approved

    # approve change
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.approve
    <txid>

    # reject change
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderation.reject
    <txid>

Step 4a. Add other moderators

    # add moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.create
    <category_txid>
    <publickey>

Step 4b. Can also add moderators with AIP

    # add moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.create
    <category_txid>
    <publickey>
    |
    15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva
    BITCOIN_ECDSA
    <signing_address>
    <signature>



Step 5. Delete a moderator
    # delete moderator
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    moderator.delete
    <publickey>

TODO: Does this solve moderation in a way that can be used with AIP?

### Forking (proposed)

    # fork
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    fork
    <category_txid>

### Undo (proposed)

    # undo 
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    undo
    <txid>

    # undoing an undo is a no-op, but you can re-do an undo
    1dirxA5oET8EmcdW4saKXzPqejmMXQwg2
    redo
    <undo_txid>

## TODO

### protocol
* unit tests for core transformations
* edit category
* delete category
* edit item
* delete item
* undo
* fork

### app
* let users tip a custom amount to someone who contributed a link and entire tip chain
* have a chain of tips where everyone in the chain gets a % of the tip
 - condense tip if same author gets multiple
 - need algorithm to calculate tip
* bug: verify edit transactions in same block don't lose their order in update and set wrong value
* fork button! let user edit html, edit paragraphs, change name, set root category, change color theme
* add recent open directories (changelog)

### design/ux
* need good loading indidcator (navigation)
* need good error indidcator, up high (message that appears)
* success after submit, show a message and what to do if it doesn't appear (success message that appears)
* add default state for no entries (no yet, why don't you add one?)
* bug: floating categories go right sometimes for some reason
* add sorting: by votes, latest
* hide create category by default

* better iconography and graphics
* better homepage description (benefits and how you can make money)

### nice to have
* add themes that stick and work during forking
* use local storage for user-specific settings, like an alternative endpiont for bitdb genesis
* optimize: don't fetch network request every single time
* give items their own page as well
* add statistics, how many categories, how many entries

### for launch
* compile step, minify, remove inbrowser babel, convert to c:// and export for web & bitcoin output
* refactor code as much as possible so it's easier to organize
* create good examples (collab with bsvdevs, onchain games, onchain art, onchain utilities)
* stress test server, see if aggregate is putting too much load


## FUTURE
* protocol for getting latest app version, put notice in app and point to new link
* might want to include edits in the tipchain
* Moderation
* AIP to sign data by author
* Plug into bit:// for genesis bitdb so we don't have to hardcode it
* Bottle bookmarklet for easily saving to a category
* pretty bitcom links, so Bottle has bot://<OPENDIR_PROTOCOL>/<txid>

## FEEDBACK
* bitdb bug: event stream is getting messages it shouldn't
* bitdb suggestion: weird edge case with bitdb on u/c when joining on both, it doubles the download data even if you try to de-duplicate
* bitdb suggestion: nice to just say "give me OP_RETURN string array" in addition to s1,s2,s3,s4,s5—useful for variable length protocols like MAP
* on-chain planaria... end up doing similar "state processing" code to bring "objects" up to date, eventually will need full Planaria, but for lighter apps, planarium.js?
* protocol processor that's a planaria state machine transformer, but embedded in a bitcoin tx, so everything is still onchain
* enable regex in jq for more advanced filtering

## about

@synfonaut
