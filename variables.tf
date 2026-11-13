variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "key_name" {
  type    = string
  default = null
}

variable "vpc_id" {
  type = string
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "allowed_cidr" {
  type    = string
  default = "0.0.0.0/0"
}

variable "docker_image" {
  type    = string
  default = "nginx:alpine"
}
