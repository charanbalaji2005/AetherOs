import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    id: root
    height: 46
    property string text: "Button"
    property string iconSymbol: ""
    property color buttonColor: "#56d4dd"
    property color textColor: "#0d1117"
    property bool isPrimary: true
    signal clicked()

    Rectangle {
        id: bg
        anchors.fill: parent
        radius: 10
        color: {
            if (!root.isPrimary) {
                return mouseArea.containsMouse ? "#30363d" : "#21262d";
            }
            return mouseArea.containsMouse ? "#7cc7ff" : root.buttonColor;
        }
        border.width: root.isPrimary ? 0 : 1
        border.color: mouseArea.containsMouse ? "#56d4dd" : "#30363d"

        scale: mouseArea.pressed ? 0.98 : 1.0

        Behavior on scale {
            NumberAnimation { duration: 100 }
        }
        Behavior on color {
            ColorAnimation { duration: 150 }
        }

        Row {
            anchors.centerIn: parent
            spacing: 8

            Text {
                text: root.iconSymbol
                visible: root.iconSymbol !== ""
                color: root.isPrimary ? root.textColor : "#56d4dd"
                font.pixelSize: 15
                anchors.verticalCenter: parent.verticalCenter
            }

            Text {
                text: root.text
                color: root.isPrimary ? root.textColor : "#e6f1f5"
                font.pixelSize: 14
                font.bold: true
                font.family: "Segoe UI, Outfit, sans-serif"
                anchors.verticalCenter: parent.verticalCenter
            }
        }

        MouseArea {
            id: mouseArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: root.clicked()
        }
    }
}
