# Jenkins CI/CD + Terraform (IaC) Project — EC2 Edition

A complete, ready-to-run project for the assignment: a **Jenkins pipeline** (checkout → build → test → docker build → deploy → verify) and a **Terraform configuration** (reusable module that provisions an EC2 server + security group).

```
cicd-project/
├── Jenkinsfile                      <- Declarative pipeline (submit this)
├── app/
│   ├── server.js                    <- Node.js/Express sample app
│   ├── package.json
│   ├── test/app.test.js             <- Jest tests (the "Test" stage)
│   ├── Dockerfile                   <- Build/deploy artifact
│   └── .dockerignore
├── terraform/                       <- IaC (submit this)
│   ├── versions.tf  main.tf  variables.tf  outputs.tf
│   ├── terraform.tfvars.example
│   └── modules/web_server/          <- reusable module (EC2 + SG)
├── scripts/
│   ├── setup-ec2-jenkins.sh         <- installs Jenkins, Docker, Node, Terraform
│   └── collect-evidence.sh          <- gathers proof for screenshots
└── .gitignore
```

---

## PART 1 — Launch the EC2 server (AWS Console)

| Setting | Value |
|---|---|
| AMI | Ubuntu Server 22.04 LTS |
| Instance type | **t3.small** (or t2.small) — t2/t3.micro is too small for Jenkins |
| Storage | 20 GB gp3 |
| Key pair | create/download a `.pem` |
| Security group inbound | **22** (SSH, My IP), **8080** (Jenkins, My IP), **3000** (App, My IP or Anywhere) |

## PART 2 — Install everything on the server

```bash
# From your laptop: copy the zip up and connect
scp -i your-key.pem cicd-project.zip ubuntu@<EC2-PUBLIC-IP>:~
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# On the server
sudo apt-get update && sudo apt-get install -y unzip
unzip cicd-project.zip && cd cicd-project
sudo bash scripts/setup-ec2-jenkins.sh
```

The script prints the Jenkins admin password at the end. 📸 **Screenshot #1:** the tool versions printed by the script.

## PART 3 — Put the code in a Git repository (required: "repository link")

Create an empty repo on GitHub (e.g. `jenkins-cicd-demo`), then on the server:

```bash
cd ~/cicd-project
git init
git add .
git commit -m "Initial commit: Jenkins CI/CD + Terraform"
git branch -M main
git remote add origin https://github.com/<your-username>/jenkins-cicd-demo.git
git push -u origin main       # use a GitHub Personal Access Token as the password
```

📸 **Screenshot #2:** your GitHub repo page. This URL is your **repository link**.

## PART 4 — Configure Jenkins

1. Open `http://<EC2-PUBLIC-IP>:8080`, paste the admin password, choose **Install suggested plugins**, create an admin user.
2. **New Item** → name `cicd-demo-pipeline` → **Pipeline** → OK.
3. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: your GitHub URL
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
4. Save.

📸 **Screenshot #3:** the job configuration page (Pipeline section showing repo + Jenkinsfile).

> If the repo is private, add credentials: *Manage Jenkins → Credentials → Add* (username + token) and select them in the job.

## PART 5 — Run the pipeline (CI/CD Execution)

Click **Build with Parameters** → leave defaults (`RUN_TERRAFORM_PLAN` ✔, `TERRAFORM_APPLY` ✘) → **Build**.

Stages that run: Checkout → Install deps → Test → Docker build → Terraform validate → Deploy → Verify.

📸 **Screenshot #4:** Stage View, all green.
📸 **Screenshot #5:** Console Output ending with `Finished: SUCCESS`.
📸 **Screenshot #6:** browser at `http://<EC2-PUBLIC-IP>:3000/` showing the JSON response.

Then run `bash scripts/collect-evidence.sh` and screenshot the output (📸 **#7**).

**Optional – show it's truly automated:** edit the message in `app/server.js`, `git commit && git push`, click Build again, refresh the browser — the change is live. (Bonus: in the job config enable *Poll SCM* with `* * * * *` so pushes trigger builds automatically.)

## PART 6 — Terraform (Infrastructure as Code)

Terraform is already installed on the server. Provide AWS credentials (easiest for a demo: an IAM user with EC2 permissions):

```bash
aws configure          # enter Access Key, Secret, region ap-south-1
cd ~/cicd-project/terraform
cp terraform.tfvars.example terraform.tfvars

terraform init
terraform fmt -recursive
terraform validate
terraform plan         # 📸 Screenshot #8: plan showing 2 resources to add
terraform apply        # type: yes   📸 Screenshot #9: "Apply complete! Resources: 2 added" + outputs
```

Open the `app_url` output in a browser (nginx welcome page) — 📸 **#10**. Check the AWS Console → EC2 to see the new instance — 📸 **#11**.

**When finished, destroy to avoid charges:**
```bash
terraform destroy      # type: yes
```

> Optional: tick `TERRAFORM_APPLY` in Jenkins to run apply from the pipeline. That needs AWS credentials available to the `jenkins` user (`sudo -u jenkins aws configure`). The safer demo is plan/validate in Jenkins and apply manually.

---

## PART 7 — Recorded demonstration (script, ~5–6 min)

Show your face/screen, speak clearly. Suggested flow:

1. **Intro (20s):** "This project demonstrates CI/CD with Jenkins and Infrastructure as Code with Terraform on an AWS EC2 server."
2. **Repo tour (45s):** show GitHub repo: `app/`, `Jenkinsfile`, `terraform/`.
3. **Jenkinsfile walkthrough (90s):** explain each stage:
   - *Checkout* pulls source from Git (source integration)
   - *Install/Test* runs `npm install` and Jest unit tests
   - *Docker build* packages the app into an image
   - *Terraform validate* checks the IaC
   - *Deploy* runs the container on the server
   - *Verify* curls `/health` to confirm deployment
4. **Jenkins job config (30s):** Pipeline script from SCM, repo URL, branch.
5. **Live run (60s):** click Build, show Stage View going green, console output, then browser app on port 3000.
6. **Terraform walkthrough (90s):** explain `main.tf` (provider, AMI data source, module call), `variables.tf`, `outputs.tf`, and the reusable `modules/web_server` (security group + EC2 + user_data). Run `terraform plan` / show the apply result and the instance in the AWS console. Mention *state file*, *idempotency*, and *declarative* approach.
7. **Wrap-up (20s):** "CI/CD automates integration, build, test and deployment; Terraform makes infrastructure repeatable and version-controlled."

### Key concepts to be able to explain
- **CI:** automatically build + test every change. **CD:** automatically deploy a tested build.
- **Jenkinsfile (Pipeline as Code):** pipeline versioned with the app.
- **Terraform:** declarative IaC; `init` → `plan` → `apply` → `destroy`; the **state file** tracks real resources; **modules/variables/outputs** give reusability.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `permission denied` on docker in Jenkins | `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins` |
| Can't open `:8080` / `:3000` | Open the port in the EC2 security group |
| `npm: command not found` in Jenkins | Re-run setup script; `sudo systemctl restart jenkins` |
| Port 3000 already in use | `docker rm -f demo-app` then rebuild |
| Jenkins stuck / out of memory | Use t3.small or larger |
| Terraform `NoCredentialProviders` | Run `aws configure` |
| Terraform AMI/instance error | Check region in `terraform.tfvars` |

## Grading checklist (maps to your rubric)

- [x] **Jenkins Configuration** — Pipeline-from-SCM job linked to Git repo (Part 4)
- [x] **Jenkinsfile / CI-CD Pipeline** — build, test, deploy stages (`Jenkinsfile`)
- [x] **CI/CD Execution** — successful run + running app (Part 5)
- [x] **Terraform Configuration** — structured, reusable module with variables/outputs (`terraform/`)
- [x] **Demonstration** — script in Part 7
