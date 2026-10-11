----------------------------- MODULE ImageLoading -----------------------------
EXTENDS TLC

CONSTANTS Hero, Offscreen, Engagement, Kinky

VARIABLES requested, loaded, collection

vars == <<requested, loaded, collection>>
Images == {Hero, Offscreen}
Collections == {Engagement, Kinky}

Init ==
    /\ requested = {Hero}
    /\ loaded = {}
    /\ collection \in [Images -> Collections]

RequestOffscreen ==
    /\ Offscreen \notin requested
    /\ requested' = requested \cup {Offscreen}
    /\ UNCHANGED <<loaded, collection>>

LoadImage(image) ==
    /\ image \in requested \ loaded
    /\ loaded' = loaded \cup {image}
    /\ UNCHANGED <<requested, collection>>

Idle ==
    /\ requested = Images
    /\ loaded = Images
    /\ UNCHANGED vars

Next ==
    RequestOffscreen
    \/ \E image \in Images : LoadImage(image)
    \/ Idle

Spec ==
    Init
    /\ [][Next]_vars
    /\ WF_vars(RequestOffscreen)

NoBracelets == \A image \in Images : collection[image] \in Collections
HeroRequestedAtFirstPaint == Hero \in requested
LoadedWithinRequested == loaded \subseteq requested
LoadedImagesNeverRegress == [][loaded \subseteq loaded']_vars
OffscreenImagesEventuallyRequested == <>(Offscreen \in requested)

===============================================================================
