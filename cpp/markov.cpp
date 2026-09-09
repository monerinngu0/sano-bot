#include <fstream>
#include <iostream>
#include <random>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

enum class MarkovOrder {
    First,
    Second,
    Backoff,
};

struct State {
    string first;
    string second;

    bool operator==(const State&) const = default;
};

struct StateHash {
    size_t operator()(const State& state) const {
        size_t h1 = hash<string>{}(state.first);
        size_t h2 = hash<string>{}(state.second);

        return h1 ^ (h2 << 1);
    }
};

class MarkovChain {
private:
    static constexpr const char* BOS = "<BOS>";
    static constexpr const char* EOS = "<EOS>";

    // 2次 Markov:
    // (prev2, prev1) -> next token -> count
    unordered_map<
        State,
        unordered_map<string, int>,
        StateHash
    > order2;

    // 1次 Markov:
    // prev1 -> next token -> count
    unordered_map<
        string,
        unordered_map<string, int>
    > order1;

    mt19937 rng{random_device{}()};

    string choose(
        const unordered_map<string, int>& candidates
    ) {
        int total = 0;

        for (const auto& [token, count] : candidates) {
            total += count;
        }

        uniform_int_distribution<int> dist(1, total);
        int value = dist(rng);

        for (const auto& [token, count] : candidates) {
            value -= count;

            if (value <= 0) {
                return token;
            }
        }

        return EOS;
    }

    string nextTokenFirst(const State& state) {
        auto it = order1.find(state.second);

        if (it == order1.end()) {
            return EOS;
        }

        return choose(it->second);
    }

    string nextTokenSecond(const State& state) {
        auto it = order2.find(state);

        if (it == order2.end()) {
            return EOS;
        }

        return choose(it->second);
    }

    string nextTokenBackoff(const State& state) {
        auto it2 = order2.find(state);

        // 文頭は2次
        if (state.first == BOS && state.second == BOS) {
            if (it2 != order2.end()) {
                return choose(it2->second);
            }
            return EOS;
        }

        // 2次に分岐があるなら使う
        if (
            it2 != order2.end() &&
            it2->second.size() >= 2
        ) {
            return choose(it2->second);
        }

        // 1次へbackoff
        auto it1 = order1.find(state.second);

        if (it1 != order1.end()) {
            return choose(it1->second);
        }

        if (it2 != order2.end()) {
            return choose(it2->second);
        }

        return EOS;
    }

public:
    void learn(const vector<string>& tokens) {
        State state{BOS, BOS};

        for (const auto& token : tokens) {
            order2[state][token]++;
            order1[state.second][token]++;

            state = {
                state.second,
                token,
            };
        }

        order2[state][EOS]++;
        order1[state.second][EOS]++;
    }

    string generate(
        MarkovOrder order = MarkovOrder::Backoff,
        int maxTokens = 100
    ) {
        State state{BOS, BOS};

        string result;

        for (int i = 0; i < maxTokens; ++i) {
            string token;

            switch (order) {
                case MarkovOrder::First:
                    token = nextTokenFirst(state);
                    break;

                case MarkovOrder::Second:
                    token = nextTokenSecond(state);
                    break;

                case MarkovOrder::Backoff:
                    token = nextTokenBackoff(state);
                    break;
            }

            if (token == EOS) {
                break;
            }

            result += token;

            state = {
                state.second,
                token,
            };
        }

        return result;
    }
};

vector<string> splitTSV(const string& line) {
    vector<string> tokens;

    string token;
    stringstream ss(line);

    while (getline(ss, token, '\t')) {
        if (!token.empty()) {
            tokens.push_back(token);
        }
    }

    return tokens;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "usage: "
             << argv[0]
             << " <corpus.tsv> [1|2|backoff]\n";
        return 1;
    }

    ifstream file(argv[1]);

    if (!file) {
        cerr << "failed to open: "
             << argv[1]
             << '\n';
        return 1;
    }

    MarkovOrder order = MarkovOrder::Backoff;

    if (argc >= 3) {
        string mode = argv[2];

        if (mode == "1") {
            order = MarkovOrder::First;
        } else if (mode == "2") {
            order = MarkovOrder::Second;
        } else if (mode == "backoff") {
            order = MarkovOrder::Backoff;
        } else {
            cerr << "unknown mode: " << mode << '\n';
            cerr << "mode: 1 | 2 | backoff\n";
            return 1;
        }
    }

    MarkovChain markov;

    string line;

    while (getline(file, line)) {
        auto tokens = splitTSV(line);

        if (!tokens.empty()) {
            markov.learn(tokens);
        }
    }

    cout << markov.generate(order) << '\n';
}
