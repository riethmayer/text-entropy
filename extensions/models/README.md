# @riethmayer/text-entropy

Measures the Shannon entropy of a piece of text. It reports entropy per
character, total entropy, and the number of distinct characters.

## Usage

Create a model definition, passing the text as a global argument:

```bash
swamp model create @riethmayer/text-entropy my-entropy \
  --global-arg text="correct horse battery staple"
```

Run the `analyze` method:

```bash
swamp model method run my-entropy analyze
```

## Output

The `result` resource has `text`, `length`, `uniqueChars`, `bitsPerChar`, and
`totalBits` fields.
