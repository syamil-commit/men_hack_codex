# MenCare patient demo

An independent, bilingual version of MenCare for testing the redesigned patient experience. The patient, courier, and lab flows use synthetic data stored in the current browser. Use fictional details and demo passwords.

## Run with Docker

From this directory, with Docker and the Compose plugin running:

```sh
docker compose up --build -d
```

Open [the patient demo](http://localhost:8081). Compose binds to localhost by default. Set `APP_PORT` to change the host port. Run `docker compose down` to stop the demo.

For a local preview without Docker, run `python3 -m http.server 8081 --bind 127.0.0.1` in this directory.

## Walkthrough

1. Open **Explore privately** to browse the guides and take the in-session risk check.
2. Use **Sign in → Sign in as demo patient**. Home shows the active specimen. Results lists published reports.
3. Open **Samples → Book a home test**. Order a kit, choose and confirm a pickup window, then review the collection steps and confirm the seal.
4. Use **Dispatch** to pick up the new sample, mark it en route, and hand it off. Use **Lab** to select the same sample ID, enter simulated results, and publish.
5. Return to **Patient → Results**. Open the report to see the summary, measurements and sample reference values, and the simulated specialist action.
6. Switch to Arabic with **ع**. The app mirrors its layout and keeps sample codes readable left-to-right.

Seeded samples cover an in-transit countdown (`SEM-DM0247`), a published report (`SEM-DM0173`), and a late lab intake (`SEM-DM0098`). This version uses its own browser storage key. Sign-in, courier tracking, and specialist contact are simulations. The demo sends no notifications and needs no external services.
