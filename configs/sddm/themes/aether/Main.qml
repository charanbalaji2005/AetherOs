import QtQuick 2.15
import QtQuick.Controls 2.15
import SddmComponents 2.0

Rectangle {
    id: root
    width: 1920; height: 1080
    
    // Background Image
    Image {
        anchors.fill: parent
        source: config.background
        fillMode: Image.PreserveAspectCrop
    }

    // Background Dimming Overlay
    Rectangle {
        anchors.fill: parent
        color: "#66000000"
    }

    // Glassmorphic Login Panel
    Rectangle {
        anchors.centerIn: parent
        width: 420; height: 460
        color: "#CC0a0a0f" // Obsidian Dark with 80% opacity
        radius: 24
        border.color: "#66f97316" // Orange-500 at 40% opacity
        border.width: 1

        Column {
            anchors.centerIn: parent
            spacing: 22

            Text {
                text: "A E T H E R"
                color: "#f97316" // Orange-500
                font.pixelSize: 32
                font.bold: true
                font.letterSpacing: 6
                anchors.horizontalCenter: parent.horizontalCenter
            }

            // SDDM automatically provides the userModel containing system users
            Text {
                text: "Welcome, " + (userModel.lastUser ? userModel.lastUser : "User")
                color: "#9ca3af" // Gray-400
                font.pixelSize: 14
                anchors.horizontalCenter: parent.horizontalCenter
            }

            TextField {
                id: passwordField
                width: 300
                height: 48
                placeholderText: "Password..."
                echoMode: TextInput.Password
                color: "white"
                font.pixelSize: 14
                focus: true
                anchors.horizontalCenter: parent.horizontalCenter
                
                background: Rectangle {
                    color: "#1a1a24"
                    radius: 12
                    border.color: passwordField.activeFocus ? "#fb7185" : "#374151"
                    border.width: 1
                }
                
                // Trigger SDDM login function on Enter key
                onAccepted: sddm.login(userModel.lastUser, passwordField.text, sessionModel.lastIndex)
            }

            Button {
                id: loginButton
                width: 300
                height: 48
                anchors.horizontalCenter: parent.horizontalCenter
                
                background: Rectangle {
                    color: loginButton.down ? "#ea580c" : "#f97316"
                    radius: 12
                }
                contentItem: Text {
                    text: "LOGIN"
                    color: "#0a0a0f"
                    font.bold: true
                    font.pixelSize: 13
                    font.letterSpacing: 2
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                
                onClicked: sddm.login(userModel.lastUser, passwordField.text, sessionModel.lastIndex)
            }
        }
    }
}
