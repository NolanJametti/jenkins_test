pipeline {
    agent any

    environment {
        CI = "true"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
    }

    post {
        success {
            echo '✅ Build et tests OK'
        }
        failure {
            echo '❌ Les tests ont échoué'
        }
    }
}
