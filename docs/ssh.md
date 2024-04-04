# SSH Configuration

## Purpose

This document is a guide to configuring your computer's SSH settings to enable connecting
to the bastion and database server in AWS. The databases on AWS are not accessible
outside of the VPC, but we need to connect to the database directly for
debugging or data inspection.
Connection to the database is possible via SSH tunneling through the bastion
host. With the right SSH configuration, we can ask the bastion host to forward
traffic from a local port on the user's computer directly to the database.

## Usage

After configuring SSH with the settings describe below, connection to the
postgres database made with the following command: `ssh -N pf-$env-postgres`.
This opens a 'tunnel' between from port 4321 on localhost to port 5432 on the
postgres database, with the bastion host acting as the intermediary. The `-N`
flag tells `ssh` to not execute any commands on the bastion server.
This command only opens the tunnel to the remote database. To connect
to the database use your favorite SQL client to connect to `localhost:4231` with
the desired database user.
E.g: `psql -h localhost -p 4321 -U pf_root -d probable_futures`.

## Configuration

Set default SSH connection configuration in `~/.ssh/config`.

```
Include config.d/*

Host *

Port 22
AddressFamily inet
ConnectTimeout 4
CheckHostIP yes
TCPKeepAlive yes

ServerAliveInterval 10
ServerAliveCountMax 5

IdentitiesOnly yes
IdentityFile ~/.ssh/identity
IdentityFile ~/.ssh/id_rsa
IdentityFile ~/.ssh/id_dsa

RhostsAuthentication no
HostbasedAuthentication no
PubkeyAuthentication yes
PasswordAuthentication no
NoHostAuthenticationForLocalhost no
ForwardAgent yes
ForwardX11 no
ForwardX11Trusted no
Protocol 2
GSSAPIAuthentication no
ChallengeResponseAuthentication no
HashKnownHosts no
GlobalKnownHostsFile /etc/ssh/ssh_known_hosts
BatchMode no
StrictHostKeyChecking ask
EscapeChar ~
SendEnv PATH
LogLevel Verbose
```

Set Probable Futures specific SSH configurations in `~/.ssh/config.d/probable-futures`

```
Host pf-development-postgres
  LocalForward 4321 development-pf-core-db-cluster.cluster-caqvnkrcpodj.us-west-2.rds.amazonaws.com:5432

Host pf-staging-postgres
  LocalForward 4321 staging-pf-core-db-cluster.cluster-caqvnkrcpodj.us-west-2.rds.amazonaws.com:5432

Host pf-production-postgres
  LocalForward 4321 production-pf-core-db-cluster.cluster-caqvnkrcpodj.us-west-2.rds.amazonaws.com:5432

Host pf-development-bastion
Host pf-development-*
  HostName ec2-35-85-62-163.us-west-2.compute.amazonaws.com

Host pf-staging-bastion
Host pf-staging-*
  HostName ec2-52-89-207-91.us-west-2.compute.amazonaws.com

Host pf-production-bastion
Host pf-production-*
  HostName ec2-52-39-236-196.us-west-2.compute.amazonaws.com

Host pf-*
  User $FIRSTNAME_LASTNAME
  IdentityFile $PATH_TO_SSH_PRIVATE_KEY
```

### Keeping Configuration Up to Date

The `HostName` of the bastion servers is not static and will change if the server
is redeployed. If your ssh config fails to connect, ensure your bastion hostnames
are up to date. This can be done via checking the EC2 Instances in the AWS Console UI
or by running the below command on the aws cli:

```
$ aws ec2 describe-instances --filters "Name=tag:Name,Values=staging-bastion" | jq '.Reservations[] | .Instances[] | .PublicDnsName'
```

Replace `staging-bastion` with `production-bastion` or `development-bastion` to
get the bastion hostname for the given environment.
