pipeline {
    agent any

    environment {
        CI = "true"
        DOCKER_IMAGE = "jamettinolan/spikeapp"
    }

    tools {
        nodejs 'node-18'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Read version') {
            steps {
                script {
                    VERSION = readFile('VERSION').trim()
                    BUILD_TAG = "${VERSION}.${env.BUILD_NUMBER}"
                    echo "Version: ${BUILD_TAG}"
                }
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${BUILD_TAG}")
                }
            }
        }

        stage('Push Docker image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
                        docker.image("${DOCKER_IMAGE}:${BUILD_TAG}").push()
                        docker.image("${DOCKER_IMAGE}:${BUILD_TAG}").push('latest')
                    }
                }
            }
        }

        stage('Push image to GitHub Container Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GITHUB_USER',
                    passwordVariable: 'GITHUB_TOKEN'
                )]) {
                    sh """
                    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

                    docker tag ${DOCKER_IMAGE}:${BUILD_TAG} ghcr.io/${GITHUB_USER}/spikeapp:${BUILD_TAG}
                    docker tag ${DOCKER_IMAGE}:${BUILD_TAG} ghcr.io/${GITHUB_USER}/spikeapp:latest

                    docker push ghcr.io/${GITHUB_USER}/spikeapp:${BUILD_TAG}
                    docker push ghcr.io/${GITHUB_USER}/spikeapp:latest
                    """
                }
            }
        }


        stage('Tag Git repository') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh """
                    git config user.email "ci@jenkins"
                    git config user.name "Jenkins CI"
                    git tag v${BUILD_TAG}
                    git push https://${GIT_USER}:${GIT_TOKEN}@github.com/NolanJametti/jenkins_test.git v${BUILD_TAG}
                    """
                }
            }
        }

    }

    post {
        success {
            echo "✅ Pipeline complète réussie"
        }
        failure {
            echo "❌ Échec de la pipeline"
        }
    }
}
