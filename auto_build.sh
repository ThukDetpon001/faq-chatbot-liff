#!/bin/bash

DOCKER_NAME='faq-chatbot-liff'

Start_timestamp=`date`

echo 
echo ===== Build docker $DOCKER_NAME in local the upload to Google Cloud kubernetes =====

if (! docker stats --no-stream > /dev/null );
then
  echo "ERROR : Docker Desktop is not running or installed"
  return
fi

if [ -z "$1"  ]
then
   echo "Please specify new version number. (Ex. 0.0.1 )"
   echo "-Click this link to see the latest version"
   echo "https://asia.gcr.io/traffy-cloud/$DOCKER_NAME"
   #gcloud container builds list | grep -P '$DOCKER_NAME' | head -n 1
   echo "-Type 'gcloud init' to switch current project"
else
   rm -r dist
   nvm use v17.5.0
   npm run build
   docker build -t asia.gcr.io/traffy-cloud/$DOCKER_NAME:$1 .
   docker push asia.gcr.io/traffy-cloud/$DOCKER_NAME:$1
   rm -r dist
   echo "-Open URL"
   echo "https://console.cloud.google.com/kubernetes/deployment/asia-east1-a/taiwan-custom-cluster1/default/$DOCKER_NAME?project=traffy-cloud"
   echo "click ACTIONS - Rolling update - change to $1"
   echo -ne '\007'
fi

echo "-To use terminal in k8s, open the link, click KUBECTL then type"
echo "https://console.cloud.google.com/kubernetes/deployment/asia-east1-a/taiwan-custom-cluster1/default/$DOCKER_NAME?project=traffy-cloud"
echo "kubectl exec --stdin --tty \`kubectl get pods | awk '{print \$1}' | grep $DOCKER_NAME-\` -- /bin/bash"
#echo "-To backup SQLite db"
#echo "kubectl cp \`kubectl get pods | awk '{print \$1}' | grep $DOCKER_NAME-\`:/app/superset_home/superset.db ./superset.db"
#echo "-To check external IP https://dashboard.traffy.in.th/external_ip.php"
#echo "-To allow external IP for Postgres https://console.cloud.google.com/sql/instances?folder=&organizationId=&project=traffy-cloud"
echo "-To delete images https://asia.gcr.io/traffy-cloud/$DOCKER_NAME"

echo 
Finish_timestamp=`date`
echo "Start  : $Start_timestamp"
echo "Finish : `date`"
echo 
