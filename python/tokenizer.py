from sudachipy import Dictionary, SplitMode
import sys

tokenizer = Dictionary().create()

for line in sys.stdin:
    text = line.rstrip("\n")

    if not text:
        continue

    tokens = tokenizer.tokenize(text, SplitMode.B)

    print("\t".join(token.surface() for token in tokens))
