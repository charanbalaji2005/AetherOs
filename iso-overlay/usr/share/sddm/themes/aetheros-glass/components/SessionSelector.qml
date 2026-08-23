import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    id: root
    width: 220
    height: 40

    property alias currentIndex: sessionCombo.currentIndex
    property alias model: sessionCombo.model

    ComboBox {
        id: sessionCombo
        anchors.fill: parent
        textRole: "name"

        background: Rectangle {
            color: sessionCombo.hovered ? "#21262dcc" : "#161b2299"
            radius: 8
            border.width: 1
            border.color: sessionCombo.hovered ? "#56d4dd" : "#30363d"

            Behavior on border.color {
                ColorAnimation { duration: 150 }
            }
        }

        contentItem: Text {
            leftPadding: 12
            text: "󰟀 " + (sessionCombo.displayText || "Hyprland (Wayland)")
            font.pixelSize: 13
            font.family: "Segoe UI, sans-serif"
            color: "#e6f1f5"
            verticalAlignment: Text.AlignVCenter
            elide: Text.ElideRight
        }

        popup: Popup {
            y: sessionCombo.height + 4
            width: sessionCombo.width
            implicitHeight: contentItem.implicitHeight + 8
            padding: 4

            contentItem: ListView {
                clip: true
                implicitHeight: contentHeight
                model: sessionCombo.popup.visible ? sessionCombo.delegateModel : null
                currentIndex: sessionCombo.highlightedIndex

                ScrollIndicator.vertical: ScrollIndicator { }
            }

            background: Rectangle {
                color: "#161b22fa"
                radius: 8
                border.width: 1
                border.color: "#56d4dd"
            }
        }

        delegate: ItemDelegate {
            width: sessionCombo.width - 8
            height: 36
            highlighted: sessionCombo.highlightedIndex === index

            contentItem: Text {
                text: model.name || "Hyprland"
                color: highlighted ? "#56d4dd" : "#e6f1f5"
                font.pixelSize: 13
                font.bold: highlighted
                verticalAlignment: Text.AlignVCenter
            }

            background: Rectangle {
                color: highlighted ? "#21262d" : "transparent"
                radius: 6
            }
        }
    }
}
