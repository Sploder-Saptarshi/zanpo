<?php
header('Content-Type: text/xml; charset=utf-8');

// Get city number from request
$citynum = isset($_GET['citynum']) ? intval($_GET['citynum']) : 0;

// Create XML document
$xml = new DOMDocument('1.0', 'UTF-8');
$xml->formatOutput = false;

// Create root element
$root = $xml->createElement('forums');
$xml->appendChild($root);

// Stub!!
$forums = [
    [
        'forum_id' => '1',
        'title' => 'General Discussion',
        'desc' => 'Talk about anything related to the city',
        'mdate' => date('y-m-d', strtotime('-1 day')),
        'lpost' => 'user123'
    ],
    [
        'forum_id' => '2',
        'title' => 'Building Showcase',
        'desc' => 'Show off your latest creations',
        'mdate' => date('y-m-d', strtotime('-1 day')),
        'lpost' => 'builder456'
    ],
    [
        'forum_id' => '3',
        'title' => 'Help & Support',
        'desc' => 'Get help with building and gameplay',
        'mdate' => date('y-m-d', strtotime('-1 day')),
        'lpost' => 'helper789'
    ]
];

// Add each forum as a child element
foreach ($forums as $forum) {
    $forumElement = $xml->createElement('forum');
    
    // Set attributes (URL encode values as expected by ActionScript unescape())
    $forumElement->setAttribute('forum_id', $forum['forum_id']);
    $forumElement->setAttribute('title', rawurlencode($forum['title']));
    $forumElement->setAttribute('desc', rawurlencode($forum['desc']));
    $forumElement->setAttribute('mdate', rawurlencode($forum['mdate']));
    $forumElement->setAttribute('lpost', rawurlencode($forum['lpost']));
    
    $root->appendChild($forumElement);
}

// Output XML
echo $xml->saveXML();
