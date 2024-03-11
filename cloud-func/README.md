# Cloud Func update

In order to update the cards available weekly without manual effort, we can use a Cloud Function on a schedule.

`REGION` should be local to your project.

```
cd cloud-func
gcloud functions deploy card_update --runtime python39 --trigger-http --region $REGION --update-env-vars MY_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
```
 * give it 4GB of memory and 120s max runtime, it currently uses ~2GB and runs in ~60s.
 * setup cloud scheduler job and service account to call it
 * see https://cloud.google.com/scheduler/docs/http-target-auth#using-the-console

 I run it via a Cloud Schedule `7 12 * * 1`.
  - target type HTTP
  - URL https://<project>.cloudfunctions.net/card_update
  - HTTP method GET
  - headers User-Agent Google-Cloud-Scheduler
  - auth header - Add OIDC token
  - Service account func-caller
  - audience same as url
  - no retry

I can't use an App Enginge cron job because the 4GB needed to update cards is more than the free tier for running the webserver.