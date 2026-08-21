# AetherOS Default Bash Configuration
HISTCONTROL=ignoreboth
shopt -s histappend
HISTSIZE=1000
HISTFILESIZE=2000

# Custom Aliases
alias ls='ls --color=auto'
alias ll='ls -lah --color=auto'
alias grep='grep --color=auto'
alias update='sudo dnf upgrade --refresh'
alias clear='clear && fastfetch'

# Display Aether OS Logo on interactive terminal launch
if [[ $- == *i* ]]; then
    fastfetch
fi
