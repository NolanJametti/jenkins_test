pipeline {
    agent any

    environment {
        CI = "true"
        DOCKER_IMAGE = "name/spikeapp"
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

        stage('Tag Git repository') {
            steps {
                script {
                    sh """
                      git config user.email "ci@jenkins"
                      git config user.name "Jenkins CI"
                      git tag v${BUILD_TAG}
                      git push origin v${BUILD_TAG}
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
