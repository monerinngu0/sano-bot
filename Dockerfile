# ---------- C++ builder ----------
FROM gcc:14 AS cpp-builder

WORKDIR /build

COPY cpp/markov.cpp ./markov.cpp

RUN g++ \
    -std=gnu++23 \
    -O2 \
    -Wall \
    -Wextra \
    markov.cpp \
    -o markov


# ---------- Runtime ----------
FROM node:24-bookworm-slim

WORKDIR /app

# Python
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Python venv
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

# Node.js dependencies
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Bot source
COPY index.js ./
COPY deploy-commands.js ./
COPY commands/ ./commands/
COPY events/ ./events/
COPY services/ ./services/
COPY python/ ./python/

# C++ executable
COPY --from=cpp-builder /build/markov ./bin/markov

# data/ itself is mounted from host
RUN mkdir -p /app/data \
    && chown -R node:node /app

USER node

CMD ["node", "index.js"]
