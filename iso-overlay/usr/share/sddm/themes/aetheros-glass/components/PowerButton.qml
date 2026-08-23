import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    id: root
    width: 44
    height: 44

    property string iconSymbol: "⏻"
    property string toolTipText: "Power"
    property color hoverColor: "#56d4dd"
    signal clicked()

    Rectangle {
        id: bg
        anchors.fill: parent
        radius: 22
        color: mouseArea.containsMouse ? "#30363dcc" : "#161b2299"
        border.width: 1
        border.color: mouseArea.containsMouse ? root.hoverColor : "#30363d88"

        scale: mouseArea.pressed ? 0.94 : (mouseArea.containsMouse ? 1.06 : 1.0)

        Behavior on scale {
            NumberAnimation { duration: 120 }
        }
        Behavior on color {
            ColorAnimation { duration: 150 }
        }

        Text {
            anchors.centerIn: parent
            text: root.iconSymbol
            color: mouseArea.containsMouse ? root.hoverColor : "#e6f1f5"
            font.pixelSize: 17
            font.bold: true
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
