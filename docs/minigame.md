# Minigame spec

Based on the Stardew Valley fishing bar, but the fish is a teddy bear, and the game only starts once the claw has actually lifted one.

## Screen layout (vertical, 170 × 320 px)

```
┌────────────┬──┐
│  water     │▓▓│ ← progress meter (red → green)
│  track     │▓▓│
│ ┌──────┐   │▓▓│
│ │  🧸  │ ← catch bar (green), bear inside
│ └──────┘   │  │
│ ▬▬▬▬▬      │  │ ← time left
└────────────┴──┘
```

## Physics (per second, track height normalised to 1.0)

| Param           | Default | Notes                                       |
| --------------- | ------- | ------------------------------------------- |
| `barHeight`     | 0.26    | Smaller on harder tiers                     |
| `gravity`       | 2.2     | Downward acceleration when not held         |
| `lift`          | 3.4     | Upward acceleration while REEL is held      |
| `bounce`        | 0.35    | Restitution when the bar hits the bottom    |
| `fillRate`      | 0.30    | Progress gained per second with bear in bar |
| `drainRate`     | 0.15    | Progress lost per second otherwise          |
| `startProgress` | 0.35    |                                             |
| `timeLimit`     | 10 s    | The claw waits at the top while you reel    |

## Bear behaviours (same names as Stardew Valley)

| Behaviour | Movement                                          |
| --------- | ------------------------------------------------- |
| `mixed`   | Random targets with medium speed                  |
| `smooth`  | Slow sine-wave drift                              |
| `dart`    | Sudden jumps over long distances                  |
| `sinker`  | Drifts toward the bottom with short bursts upward |
| `floater` | Drifts toward the top with short dips downward    |

## Bears

Each bear's colour sets how it moves and how hard it is to reel in. `weight` is how often that colour gets stocked.

| Bear    | Behaviour           | Difficulty | barHeight | weight |
| ------- | ------------------- | ---------- | --------- | ------ |
| Cocoa   | `smooth`            | 30         | 0.30      | 4      |
| Honey   | `mixed`             | 50         | 0.27      | 4      |
| Blossom | `mixed` + `floater` | 60         | 0.25      | 3      |
| Snow    | `dart`              | 75         | 0.22      | 2      |
| Goldie  | `dart` + `sinker`   | 95         | 0.18      | 1      |

## Outcome

The meter is fed into the prong torque limit on every physics step: `torque = GRIP.min + (GRIP.max - GRIP.min) × progress`.

- **Meter full:** the grip locks at max and the claw carries the bear to the chute.
- **Meter empty:** the claw opens.
- **Bear no longer held:** the round ends as "slipped".
- **Time runs out:** the grip stays where the meter left it for the trip home.
