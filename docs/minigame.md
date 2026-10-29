# Minigame spec

Based on the Stardew Valley fishing bar and adapted for one button and a short window.

## Screen layout (vertical, 170 × 320 px)

```
┌────────────┬──┐
│  water     │▓▓│ ← progress meter (red → green)
│  track     │▓▓│
│ ┌──────┐   │▓▓│
│ │  🐟  │ ← catch bar (green), fish inside
│ └──────┘   │  │
│      💰    │  │ ← optional treasure chest
└────────────┴──┘
```

## Physics (per second, track height normalised to 1.0)

| Param           | Default | Notes                                       |
| --------------- | ------- | ------------------------------------------- |
| `barHeight`     | 0.26    | Smaller on harder tiers                     |
| `gravity`       | 2.2     | Downward acceleration when not held         |
| `lift`          | 3.4     | Upward acceleration while REEL is held      |
| `bounce`        | 0.35    | Restitution when the bar hits the bottom    |
| `fillRate`      | 0.32    | Progress gained per second with fish in bar |
| `drainRate`     | 0.15    | Progress lost per second otherwise          |
| `startProgress` | 0.35    |                                             |
| `timeLimit`     | 9 s     | Roughly matched to the claw drop and settle |

## Fish behaviours (same names as Stardew Valley)

| Behaviour | Movement                                          |
| --------- | ------------------------------------------------- |
| `mixed`   | Random targets with medium speed                  |
| `smooth`  | Slow sine-wave drift                              |
| `dart`    | Sudden jumps over long distances                  |
| `sinker`  | Drifts toward the bottom with short bursts upward |
| `floater` | Drifts toward the top with short dips downward    |

## Prize tiers

The prize bed is split into zones. The zone under the claw picks the fish.

| Tier      | Prizes               | Behaviour         | Difficulty | barHeight |
| --------- | -------------------- | ----------------- | ---------- | --------- |
| Common    | Plush veggies        | `smooth`          | 25         | 0.30      |
| Uncommon  | Plush fish           | `mixed`           | 50         | 0.26      |
| Rare      | Treasure-chest plush | `dart`            | 75         | 0.22      |
| Legendary | Featured item        | `dart` + `sinker` | 95         | 0.18      |

## Treasure chest

There is a 25 % chance per round that a chest appears. Keeping it inside the bar for 1.2 s in total grabs it, which adds a +10 % grip bonus and plays a chime.

## Outcome

`grip = curve(progress) + (treasure ? 0.10 : 0)`, clamped to [0.25, 1.0]. The firmware sends this to the claw coil as a PWM duty cycle.
