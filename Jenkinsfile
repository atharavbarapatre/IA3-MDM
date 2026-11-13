pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        booleanParam(name: 'RUN_TERRAFORM_PLAN', defaultValue: true,
                     description: 'Run terraform init/validate/plan as part of the pipeline')
        booleanParam(name: 'TERRAFORM_APPLY', defaultValue: false,
                     description: 'Run terraform apply (needs AWS credentials on the Jenkins server)')
    }

    environment {
        IMAGE_NAME     = 'jenkins-cicd-demo-app'
        CONTAINER_NAME = 'demo-app'
        APP_PORT       = '3000'
        APP_VERSION    = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Source - Checkout') {
            steps {
                // Pulls the repo configured in the Jenkins job (Pipeline script from SCM)
                checkout scm
                sh 'git log -1 --pretty="Commit: %h | %an | %s"'
            }
        }

        stage('Build - Install Dependencies') {
            steps {
                dir('app') {
                    sh 'node --version && npm --version'
                    sh 'npm install'
                }
            }
        }

        stage('Test') {
            steps {
                dir('app') {
                    sh 'npm test'
                }
            }
        }

        stage('Build - Docker Image') {
            steps {
                dir('app') {
                    sh """
                      docker build --build-arg APP_VERSION=${APP_VERSION} \
                                   -t ${IMAGE_NAME}:${APP_VERSION} \
                                   -t ${IMAGE_NAME}:latest .
                    """
                }
                sh "docker images ${IMAGE_NAME}"
            }
        }

        stage('Terraform - Validate / Plan') {
            when { expression { return params.RUN_TERRAFORM_PLAN } }
            steps {
                dir('terraform') {
                    sh 'terraform version'
                    sh 'terraform init -input=false -backend=false'
                    sh 'terraform fmt -check -recursive || terraform fmt -recursive'
                    sh 'terraform validate'
                }
            }
        }

        stage('Terraform - Apply (optional)') {
            when { expression { return params.TERRAFORM_APPLY } }
            steps {
                dir('terraform') {
                    sh 'terraform init -input=false'
                    sh 'terraform plan -input=false -out=tfplan'
                    sh 'terraform apply -input=false -auto-approve tfplan'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                  docker rm -f ${CONTAINER_NAME} || true
                  docker run -d --name ${CONTAINER_NAME} --restart unless-stopped \
                             -p ${APP_PORT}:3000 ${IMAGE_NAME}:${APP_VERSION}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                  for i in 1 2 3 4 5 6 7 8 9 10; do
                    if curl -fs http://localhost:${APP_PORT}/health; then
                      echo ""
                      echo "Deployment healthy"
                      curl -s http://localhost:${APP_PORT}/
                      echo ""
                      exit 0
                    fi
                    echo "Waiting for app to start... ($i)"
                    sleep 3
                  done
                  echo "Deployment failed health check"
                  docker logs ${CONTAINER_NAME}
                  exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "SUCCESS: build #${env.BUILD_NUMBER} deployed. Open http://<EC2-PUBLIC-IP>:${APP_PORT}/"
        }
        failure {
            echo 'FAILURE: check the stage logs above.'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
