import QtQuick 2.15

Item {
    id: root
    width: 300
    height: 90

    property string timeText: "00:00"
    property string dateText: "Monday, January 1"

    Timer {
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            var date = new Date();
            root.timeText = Qt.formatTime(date, "hh:mm AP");
            root.dateText = Qt.formatDate(date, "dddd, MMMM d, yyyy");
        }
    }

    Column {
        anchors.centerIn: parent
        spacing: 4

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.timeText
            color: "#ffffff"
            font.pixelSize: 42
            font.bold: true
            font.family: "Outfit, Segoe UI, sans-serif"
            style: Text.Outline
            styleColor: "#00000055"
        }

        Text {
            anchors.horizontalCenter: parent.horizontalCenter
            text: root.dateText
            color: "#56d4dd"
            font.pixelSize: 14
            font.weight: Font.Medium
            font.family: "Segoe UI, sans-serif"
            style: Text.Outline
            styleColor: "#00000055"
        }
    }
}
