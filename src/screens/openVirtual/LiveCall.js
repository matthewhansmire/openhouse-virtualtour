import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Animated,
  ScrollView,
  Text,
  Image,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ImageBackground
} from "react-native";
import normalize from 'react-native-normalize';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";

import {
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
  TwilioVideo
} from "react-native-twilio-video-webrtc";

import {
  BrowseCard,
  Button,
  CallCard,
  Header,
  LabelTag,
  PropertyCard,
  SearchBox,
  SideMenu,
  SignModal,
} from '@components';
import { Colors, Images, LoginInfo, RouteParam } from '@constants';

export default class LiveCallScreen extends Component {
  state = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    status: "disconnected",
    participants: new Map(),
    videoTracks: new Map(),
    roomName: "",
    token: ""
  };

  componentDidMount() {
    // this.setState({
    //   roomName: "15549-1-S-3204165-39413",
    //   token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTSzZjYTA4NzA0ZGM1ZTkwY2I0NmQ2YjkxNjFlZjhhYWY0LTE1OTA5NzgxNjMiLCJpc3MiOiJTSzZjYTA4NzA0ZGM1ZTkwY2I0NmQ2YjkxNjFlZjhhYWY0Iiwic3ViIjoiQUNhNjEyZjNjZDE2NzJmYmU1OTFkYTNlYWQwMWU1ODMwNSIsImV4cCI6MTU5MDk4MTc2MywiZ3JhbnRzIjp7ImlkZW50aXR5IjoiNiIsInZpZGVvIjp7InJvb20iOiIxNTU0OS0xLVMtMzIwNDE2NS0zOTQxMyJ9fX0.hzD-Ak4Gz0c5WNfZQTa2ItlUD1lzhd5FtVCPLVKJiIE"
    // })
    this.setState({
      roomName: RouteParam.liveInfo.roomname,
      token: RouteParam.liveInfo.token
    });

    this._onConnectButtonPress();
  }

  _onConnectButtonPress = () => {
    try {
      console.log(this.state.roomName, this.state.token,
        RouteParam.liveInfo.roomname, RouteParam.liveInfo.token);
        
      this.twilioRef.connect({
        // roomName: this.state.roomName,
        // accessToken: this.state.token
        roomName: RouteParam.liveInfo.roomname,
        accessToken: RouteParam.liveInfo.token
      });
    } catch (error) {
      console.log('live connect error', error);
    }
    this.setState({ status: "connecting" });
  };

  _onEndButtonPress = () => {
    this.twilioRef.disconnect();
    this.props.navigation.navigate('Property');
  };

  _onMuteButtonPress = () => {
    this.twilioRef
      .setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({ isAudioEnabled: isEnabled }));
  };

  _onFlipButtonPress = () => {
    this.twilioRef.flipCamera();
  };

  _onRoomDidConnect = () => {
    console.log("LiveCall :: connected")
    this.setState({ status: "connected" });
  };

  _onRoomDidDisconnect = ({ roomName, error }) => {
    console.log("_onRoomDidDisconnect: ", error);
    this.setState({ status: "disconnected" });
  };

  _onRoomDidFailToConnect = error => {
    console.log("_onRoomDidFailToConnect: ", error);
    this.setState({ status: "disconnected" });
  };

  _onParticipantAddedVideoTrack = ({ participant, track }) => {
    //console.log("onParticipantAddedVideoTrack: ", participant, track);

    this.setState({
      videoTracks: new Map([
        ...this.state.videoTracks,
        [
          track.trackSid,
          { participantSid: participant.sid, videoTrackSid: track.trackSid }
        ]
      ])
    });
  };

  _onParticipantRemovedVideoTrack = ({ participant, track }) => {
    console.log("onParticipantRemovedVideoTrack: ", participant, track);

    const videoTracks = this.state.videoTracks;
    videoTracks.delete(track.trackSid);

    this.setState({ videoTracks: new Map([...videoTracks]) });
  };

  setTwilioRef = ref => {
    this.twilioRef = ref;
  };

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground style={styles.container} source={{ uri: RouteParam.openHouseIntro.page_background_photo }}>
          <View style={{ width: '100%' }}>
            <Header title={RouteParam.openHouseIntro.property_mlsnumber} titleColor={Colors.whiteColor} onPressBack={() => this.props.navigation.navigate('Property')} />
          </View>
          {this.state.status === "connected" && (
            <View style={styles.remoteGrid}>
              {Array.from(
                this.state.videoTracks,
                ([trackSid, trackIdentifier]) => {
                  return (
                    <TwilioVideoParticipantView
                      style={styles.remoteVideo}
                      key={trackSid}
                      trackIdentifier={trackIdentifier}
                    />
                  );
                }
              )}
            </View>
          )}
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={this._onEndButtonPress}>
              <Text style={{ fontSize: 12 }}>End</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={this._onMuteButtonPress}>
              <Text style={{ fontSize: 12 }}>
                {this.state.isAudioEnabled ? "Mute" : "Unmute"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={this._onFlipButtonPress}>
              <Text style={{ fontSize: 12 }}>Flip</Text>
            </TouchableOpacity>
            <TwilioVideoLocalView enabled={true} style={styles.localVideo} />
            <View />
          </View>
        </ImageBackground>

        <TwilioVideo
          ref={this.setTwilioRef}
          onRoomDidConnect={this._onRoomDidConnect}
          onRoomDidDisconnect={this._onRoomDidDisconnect}
          onRoomDidFailToConnect={this._onRoomDidFailToConnect}
          onParticipantAddedVideoTrack={this._onParticipantAddedVideoTrack}
          onParticipantRemovedVideoTrack={this._onParticipantRemovedVideoTrack}
        />
      </View>
    );
  }
};

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,1)",
    flex: 1,
    width: width,
    height: height
  },
  body: {
    width: '100%',
    height: height * .8,
    marginTop: normalize(20, 'height'),
    justifyContent: 'flex-end',
    //borderWidth: 1
  },
  // callContainer: {
  //   flex: 1,
  //   position: "absolute",
  //   bottom: 0,
  //   top: 0,
  //   left: 0,
  //   right: 0
  // },
  welcome: {
    fontSize: 30,
    textAlign: "center",
    paddingTop: 40
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginRight: 70,
    marginLeft: 70,
    marginTop: 50,
    textAlign: "center",
    backgroundColor: "white"
  },
  button: {
    marginTop: 100
  },
  localVideo: {
    flex: 1,
    width: 125,
    height: 200,
    position: "absolute",
    right: 10,
    bottom: 400,
    borderRadius: 2,
    borderColor: '#4e4e4e'
  },
  remoteGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  remoteVideo: {
    width: '100%',
    height: '100%'
  },
  optionsContainer: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    height: 100,
    // backgroundColor: "blue",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center'
  },
  optionButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: "grey",
    justifyContent: "center",
    alignItems: "center"
  }
});

