#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu 22.04/24.04 EC2 instance:  sudo bash setup-ec2-jenkins.sh
# Installs: Java 17, Jenkins, Docker, Node.js 20, Git, Terraform, AWS CLI
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash $0"; exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating packages"
apt-get update -y
apt-get install -y curl gnupg unzip git ca-certificates wget lsb-release software-properties-common fontconfig

echo "==> Java 17"
apt-get install -y openjdk-17-jre

echo "==> Jenkins"
mkdir -p /etc/apt/keyrings
wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key || \
wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  > /etc/apt/sources.list.d/jenkins.list
apt-get update -y
apt-get install -y jenkins

echo "==> Docker"
apt-get install -y docker.io
systemctl enable --now docker
usermod -aG docker jenkins
usermod -aG docker ubuntu || true

echo "==> Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "==> Terraform"
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  > /etc/apt/sources.list.d/hashicorp.list
apt-get update -y
apt-get install -y terraform

echo "==> AWS CLI v2"
if ! command -v aws >/dev/null 2>&1; then
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
fi

echo "==> Starting Jenkins"
systemctl enable jenkins
systemctl restart jenkins

echo ""
echo "================ VERSIONS ================"
java -version 2>&1 | head -1
docker --version
node --version
terraform version | head -1
git --version
echo "=========================================="
echo "Jenkins URL : http://<EC2-PUBLIC-IP>:8080"
echo "Admin password:"
sleep 15
cat /var/lib/jenkins/secrets/initialAdminPassword || echo "(not ready yet - wait 30s and cat /var/lib/jenkins/secrets/initialAdminPassword)"
