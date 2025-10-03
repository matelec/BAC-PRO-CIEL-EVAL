#!/bin/bash

# mise à jour de l'OS
apt-get update && apt-get upgrade -y

# installation des paquets nécessaires à l'installation
apt-get install -y ca-certificates curl gnupg

# Ajout de la clé GPG officielle de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Ajout du dépôt officiel de Docker version stable
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# mise à jour de la liste des dépots
apt-get update

# installation des paquets docker et complémentaires
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
