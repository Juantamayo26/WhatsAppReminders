## Usage ##

 - 1. `cargo lambda watch --no-reload`

 Open another terminal and run:

 - 2. `cargo lambda invoke reminders-scheduler-rs --data-file exampleLambdaPayload.json`

## Release ##

Run: 
`cargo lambda build --release && cargo lambda deploy --env-file .env`
