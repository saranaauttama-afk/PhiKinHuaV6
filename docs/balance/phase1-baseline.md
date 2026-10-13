# Phase 1 baseline (before the NOTFM card rebuild)

Command: `npm run balance -- --runs 30` · branch work/notfm-rebuild after legacy-mode and minion removal.

```
balance · 30 runs/cell · policy tactical · 52.6s
columns: deathNight = losses on night 1/2/3 · deathKind & turns & hpLoss = normal/elite/boss
class    d    win   stalled deathNight deathKind turns          hpLoss           fights  deck   killers                                 
shaman   1    17%   0    25/0/0   6/0/19   3.4/2.7/5.6    4.2/1.9/29.2     10.3    9.8    night-head-collector×19 phi-pong-kang×4 phi-nang-ram×2
shaman   3    0%    0    30/0/0   13/11/6  4.2/3.9/4.8    10.1/16.7/24.5   4.9     9.2    night-head-collector×6 phi-pa×4 phi-pong-kang×4
shaman   5    0%    0    30/0/0   16/12/2  4.5/4.3/2.5    10.6/13.6/24     4.2     9.2    phi-pong-kang×11 ngu-phi-sang×4 phi-pop×3
warrior  1    53%   0    12/2/0   0/0/14   3.3/4.3/7.2    1.7/2.9/24.4     20      12.8   night-head-collector×12 night-bell-keeper×2
warrior  3    20%   0    23/0/1   1/3/20   3.5/4/4.8      4.2/7.6/23.8     12.1    11.5   night-head-collector×19 krahang×3 night-headless-king×1
warrior  5    3%    0    28/1/0   4/13/12  4.4/5.3/4.5    7.5/17.4/28.9    6.9     10.9   night-head-collector×11 phi-pong-kang×6 ngu-phi-sang×3
nun      1    13%   0    26/0/0   5/0/21   8.4/7/11.2     0.9/0.3/38.9     9.1     11.5   night-head-collector×21 phi-pop×5       
nun      3    7%    0    28/0/0   12/6/10  9/8.5/7.6      4.2/17.2/29.8    6       11.5   phi-pop×12 night-head-collector×10 krahang×3
nun      5    0%    0    30/0/0   15/11/4  11.8/12.2/6.3  8.9/33.2/22.8    3.6     11.1   phi-pop×15 night-head-collector×4 phi-nang-ram×3
medium   1    77%   0    6/1/0    0/0/7    2.7/2.7/4.5    1.3/1.1/11.8     25      12.5   night-head-collector×6 night-bell-keeper×1
medium   3    20%   0    23/1/0   3/1/20   3.4/3.7/4.3    2.9/5.2/21.2     11.6    10.8   night-head-collector×19 phi-pong-kang×1 night-root-lord×1
medium   5    7%    0    26/0/2   2/10/16  3.4/3.8/3.7    4.2/7/20.1       9.2     10.5   night-head-collector×14 ngu-phi-sang×4 phi-pong-kang×3
```

Night 1's boss (night-head-collector) ends most runs at difficulty 1; normal and elite fights barely scratch any class except the nun, whose fights run 8–12 turns.
