# AetherOS Default ZSH Configuration
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory

# Keybindings & Prompt
autoload -Uz promptinit && promptinit
autoload -Uz colors && colors

# Custom Aliases
alias ls='ls --color=auto'
alias ll='ls -lah --color=auto'
alias grep='grep --color=auto'
alias update='sudo dnf upgrade --refresh'
alias clear='clear && fastfetch'

# Display Aether OS Logo on terminal launch
if [[ $- == *i* ]]; then
    fastfetch
fi
